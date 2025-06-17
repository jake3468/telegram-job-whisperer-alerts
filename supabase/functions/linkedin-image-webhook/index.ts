
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if an image already exists for this post
    const { data: existingImage, error: checkError } = await supabase
      .from('linkedin_post_images')
      .select('id')
      .eq('post_id', post_id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing image:', checkError)
    }

    // Check if limit is reached (one image per post)
    if (existingImage) {
      console.log('Image already exists for this post, returning success response')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image already exists for this post',
          image_exists: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Get the N8N webhook URL from environment variables
    const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      console.error('N8N_LINKEDIN_IMAGE_WEBHOOK_URL environment variable not found')
      throw new Error('N8N webhook URL not configured')
    }

    console.log('Using N8N webhook URL:', n8nWebhookUrl.substring(0, 50) + '...')
    console.log('Triggering N8N webhook with payload:', {
      post_heading,
      variation_number,
      user_name,
      post_id,
      source
    })

    // Call the N8N webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_heading,
        post_content,
        variation_number,
        user_name,
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
    console.log('N8N webhook raw response:', responseText)

    // Handle empty response
    if (!responseText || responseText.trim() === '') {
      console.log('N8N webhook returned empty response, treating as async trigger')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          triggered: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let result
    try {
      // Try to parse as JSON
      result = JSON.parse(responseText)
      
      // If the result itself is a string, try to parse it again
      if (typeof result === 'string') {
        console.log('Response is stringified JSON, parsing again...')
        result = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse N8N response:', parseError)
      console.error('Raw response was:', responseText)
      
      // If parsing fails, consider it a successful trigger but no immediate image data
      console.log('N8N webhook triggered successfully, waiting for async response')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          triggered: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('N8N webhook parsed response:', result)

    // Check if the response contains image data
    if (result && result.success && result.image_data) {
      console.log('Image data found, storing in database...')
      
      // Store the image in the database (without user_id since we removed it)
      const { data: storedImage, error: storeError } = await supabase
        .from('linkedin_post_images')
        .insert({
          post_id: result.post_id || post_id,
          image_data: result.image_data
        })
        .select()
        .single()

      if (storeError) {
        console.error('Failed to store image in database:', storeError)
        throw new Error('Failed to store image in database')
      } else {
        console.log('Image stored successfully in database with ID:', storedImage.id)
      }
      
      // Broadcast the image data to all listening clients
      const channelName = `linkedin-image-${result.post_id || post_id}`
      console.log(`Broadcasting to channel: ${channelName}`)
      
      const { error: broadcastError } = await supabase.channel(channelName)
        .send({
          type: 'broadcast',
          event: 'linkedin_image_generated',
          payload: {
            success: true,
            image_data: result.image_data,
            post_id: result.post_id || post_id,
            source: source,
            stored_image_id: storedImage.id
          }
        })

      if (broadcastError) {
        console.error('Failed to broadcast image data:', broadcastError)
      } else {
        console.log('Image data broadcasted successfully')
      }
      
      // Also broadcast to history channel
      const historyChannelName = `linkedin-image-history-${result.post_id || post_id}`
      const { error: historyBroadcastError } = await supabase.channel(historyChannelName)
        .send({
          type: 'broadcast',
          event: 'linkedin_image_generated',
          payload: {
            success: true,
            image_data: result.image_data,
            post_id: result.post_id || post_id,
            source: source,
            stored_image_id: storedImage.id
          }
        })

      if (historyBroadcastError) {
        console.error('Failed to broadcast to history channel:', historyBroadcastError)
      } else {
        console.log('Image data broadcasted to history channel successfully')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generated and stored successfully',
          data: result,
          stored_image_id: storedImage.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.log('N8N webhook triggered successfully, no immediate image data - will wait for async response')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          triggered: true
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
