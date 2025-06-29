
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
    const requestBody = await req.json()
    console.log('LinkedIn image webhook received payload:', requestBody)

    // Extract data from the request - handle both direct calls and webhook router calls
    let post_heading, post_content, variation_number, user_name, post_id, source
    
    if (requestBody.linkedin_image) {
      // Called from database trigger via webhook router
      const linkedinImage = requestBody.linkedin_image
      post_id = linkedinImage.post_id
      variation_number = linkedinImage.variation_number
      source = 'database_trigger'
      
      // Get post data to extract heading and content
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: postData, error: postError } = await supabase
        .from('job_linkedin')
        .select('post_heading_1, post_content_1, post_heading_2, post_content_2, post_heading_3, post_content_3')
        .eq('id', post_id)
        .single()
        
      if (postError) {
        console.error('Error fetching post data:', postError)
        throw new Error('Failed to fetch post data')
      }
      
      // Select the appropriate heading and content based on variation number
      if (variation_number === 1) {
        post_heading = postData.post_heading_1
        post_content = postData.post_content_1
      } else if (variation_number === 2) {
        post_heading = postData.post_heading_2
        post_content = postData.post_content_2
      } else if (variation_number === 3) {
        post_heading = postData.post_heading_3
        post_content = postData.post_content_3
      }
      
      // Get user name if available
      if (requestBody.user) {
        user_name = `${requestBody.user.first_name || ''} ${requestBody.user.last_name || ''}`.trim() || 'Professional User'
      } else {
        user_name = 'Professional User'
      }
    } else {
      // Direct call from frontend
      post_heading = requestBody.post_heading
      post_content = requestBody.post_content
      variation_number = requestBody.variation_number
      user_name = requestBody.user_name || 'Professional User'
      post_id = requestBody.post_id
      source = requestBody.source || 'frontend'
    }

    console.log('Processing LinkedIn image generation with:', { post_id, variation_number, source })

    // Validate required parameters
    if (!post_id || !variation_number) {
      console.error('Missing required parameters: post_id or variation_number')
      throw new Error('post_id and variation_number are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Call the N8N webhook with the correct payload structure
    const n8nPayload = {
      post_heading,
      post_content,
      variation_number,
      user_name,
      post_id,
      source,
      timestamp: new Date().toISOString(),
      triggered_from: req.headers.get('origin') || 'linkedin-image-webhook'
    }

    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
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
          triggered: true,
          variation_number: variation_number
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
          triggered: true,
          variation_number: variation_number
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('N8N webhook parsed response:', result)

    // Check if the response contains image data
    if (result && result.success && result.image_data) {
      console.log(`Image data found for variation ${variation_number}, storing in database...`)
      
      // Store the image in the database with variation_number
      const { data: storedImage, error: storeError } = await supabase
        .from('linkedin_post_images')
        .insert({
          post_id: result.post_id || post_id,
          image_data: result.image_data,
          variation_number: variation_number
        })
        .select()
        .single()

      if (storeError) {
        console.error('Failed to store image in database:', storeError)
        throw new Error('Failed to store image in database: ' + storeError.message)
      } else {
        console.log(`Image stored successfully in database with ID: ${storedImage.id} for variation ${variation_number}`)
      }
      
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
      console.log(`N8N webhook triggered successfully for variation ${variation_number}, no immediate image data - will wait for async response`)
      
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
