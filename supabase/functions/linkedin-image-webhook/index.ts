
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { post_heading, post_content, variation_number, user_name, post_id, source } = await req.json()

    console.log('LinkedIn image webhook called with:', { post_id, variation_number, source })

    // Validate required parameters
    if (!post_id || !variation_number) {
      console.error('Missing required parameters: post_id or variation_number')
      throw new Error('post_id and variation_number are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the post data to extract heading and content
    let postHeading = post_heading;
    let postContent = post_content;
    let userName = user_name;

    if (!postHeading || !postContent) {
      console.log('Missing post data, fetching from database...')
      const { data: postData, error: postError } = await supabase
        .from('job_linkedin')
        .select(`
          post_heading_${variation_number},
          post_content_${variation_number},
          user_profile!inner(
            users!inner(first_name, last_name)
          )
        `)
        .eq('id', post_id)
        .single()

      if (postError) {
        console.error('Error fetching post data:', postError)
        throw new Error('Failed to fetch post data')
      }

      postHeading = postData[`post_heading_${variation_number}`]
      postContent = postData[`post_content_${variation_number}`]
      const user = postData.user_profile?.users
      userName = user ? `${user.first_name} ${user.last_name}` : 'Professional User'
    }

    // Get the N8N webhook URL from environment variables
    const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      console.error('N8N_LINKEDIN_IMAGE_WEBHOOK_URL environment variable not found')
      
      // Update any existing generating record to show failed status
      await supabase
        .from('linkedin_post_images')
        .update({ image_data: 'failed - webhook URL not configured' })
        .eq('post_id', post_id)
        .eq('variation_number', variation_number)
        .eq('image_data', 'generating...')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'N8N webhook URL not configured in environment variables',
          webhook_url_configured: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    console.log('Using N8N webhook URL (first 50 chars):', n8nWebhookUrl.substring(0, 50) + '...')
    console.log('Triggering N8N webhook with payload:', {
      post_heading: postHeading,
      variation_number,
      user_name: userName,
      post_id,
      source
    })

    // Call the N8N webhook directly with the correct full URL
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_heading: postHeading,
        post_content: postContent,
        variation_number,
        user_name: userName,
        post_id,
        source,
        timestamp: new Date().toISOString(),
        triggered_from: req.headers.get('origin') || 'linkedin-image-webhook'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`N8N webhook failed: ${response.status} ${response.statusText}`, errorText)
      
      // Update any existing generating record to show failed status
      await supabase
        .from('linkedin_post_images')
        .update({ image_data: `failed - webhook error: ${response.status}` })
        .eq('post_id', post_id)
        .eq('variation_number', variation_number)
        .eq('image_data', 'generating...')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `N8N webhook failed: ${response.statusText}`,
          webhook_url_configured: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // Parse N8N response - expecting format: { success: true, image_data: "data:image/png;base64,...", variation_number: 1, post_id: "xxx" }
    const responseData = await response.json()
    console.log('N8N webhook response:', responseData)

    // Check if N8N returned image data directly
    if (responseData.success && responseData.image_data) {
      console.log('N8N returned image data directly, updating database...')
      
      // Update the existing "generating..." record with the actual image data
      const { data: updateResult, error: updateError } = await supabase
        .from('linkedin_post_images')
        .update({ image_data: responseData.image_data })
        .eq('post_id', post_id)
        .eq('variation_number', variation_number)
        .eq('image_data', 'generating...')
        .select()

      if (updateError) {
        console.error('Error updating existing generating record:', updateError)
        
        // If update failed, try to create a new record (fallback)
        const { error: insertError } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: post_id,
            variation_number: variation_number,
            image_data: responseData.image_data
          })

        if (insertError) {
          console.error('Error creating fallback record:', insertError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to save image data',
              details: insertError.message
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        } else {
          console.log('Successfully created fallback image record')
        }
      } else if (updateResult && updateResult.length > 0) {
        console.log('Successfully updated existing generating record')
      } else {
        console.log('No generating record found to update, creating new record...')
        
        // Create new record if no generating record was found
        const { error: insertError } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: post_id,
            variation_number: variation_number,
            image_data: responseData.image_data
          })

        if (insertError) {
          console.error('Error creating new record:', insertError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create image record',
              details: insertError.message
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        } else {
          console.log('Successfully created new image record')
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image processed and stored successfully',
          image_data_received: true,
          variation_number: variation_number
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If no direct image data, return success for webhook trigger
    console.log(`N8N webhook triggered successfully for variation ${variation_number}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image generation triggered successfully',
        triggered: true,
        variation_number: variation_number,
        webhook_url_configured: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in linkedin-image-webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        webhook_url_configured: !!Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
