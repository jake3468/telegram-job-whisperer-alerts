
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
      throw new Error('N8N webhook URL not configured')
    }

    console.log('Using N8N webhook URL:', n8nWebhookUrl.substring(0, 50) + '...')
    console.log('Triggering N8N webhook with payload:', {
      post_heading: postHeading,
      variation_number,
      user_name: userName,
      post_id,
      source
    })

    // Call the N8N webhook directly
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
        triggered_from: req.headers.get('origin') || 'unknown'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`N8N webhook failed: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`N8N webhook failed: ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('N8N webhook response:', responseText)

    // Handle the response and store image if available
    let result
    try {
      result = responseText ? JSON.parse(responseText) : null
    } catch (parseError) {
      console.log('N8N webhook triggered successfully, waiting for async response')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          triggered: true,
          variation_number: variation_number
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if the response contains image data
    if (result && result.success && result.image_data) {
      console.log(`Image data found for variation ${variation_number}, storing in database...`)
      
      // Store the image in the database
      const { data: storedImage, error: storeError } = await supabase
        .from('linkedin_post_images')
        .insert({
          post_id: post_id,
          image_data: result.image_data,
          variation_number: variation_number
        })
        .select()
        .single()

      if (storeError) {
        console.error('Failed to store image in database:', storeError)
        throw new Error('Failed to store image in database: ' + storeError.message)
      }

      console.log(`Image stored successfully in database with ID: ${storedImage.id}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generated and stored successfully',
          data: result,
          stored_image_id: storedImage.id,
          variation_number: variation_number
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.log(`N8N webhook triggered successfully for variation ${variation_number}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          triggered: true,
          variation_number: variation_number
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in linkedin-image-webhook:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
