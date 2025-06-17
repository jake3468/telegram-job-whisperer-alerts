
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

    // Get the N8N webhook URL from environment variables
    const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      console.error('N8N_LINKEDIN_IMAGE_WEBHOOK_URL environment variable not found')
      throw new Error('N8N webhook URL not configured')
    }

    console.log('Using N8N webhook URL:', n8nWebhookUrl.substring(0, 50) + '...')

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

    const result = await response.json()
    console.log('N8N webhook response:', result)

    // If the response contains image data, broadcast it via Supabase realtime
    if (result.success && result.image_data) {
      console.log('Broadcasting image data via Supabase realtime...')
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // Broadcast the image data to all listening clients
      const channelName = `linkedin-image-${post_id}-${variation_number}`
      console.log(`Broadcasting to channel: ${channelName}`)
      
      const { error: broadcastError } = await supabase.channel(channelName)
        .send({
          type: 'broadcast',
          event: 'linkedin_image_generated',
          payload: {
            success: true,
            image_data: result.image_data,
            variation_number: result.variation_number || variation_number,
            post_id: result.post_id || post_id,
            source: source
          }
        })

      if (broadcastError) {
        console.error('Failed to broadcast image data:', broadcastError)
      } else {
        console.log('Image data broadcasted successfully')
      }
      
      // Also broadcast to history channel
      const historyChannelName = `linkedin-image-history-${post_id}`
      const { error: historyBroadcastError } = await supabase.channel(historyChannelName)
        .send({
          type: 'broadcast',
          event: 'linkedin_image_generated',
          payload: {
            success: true,
            image_data: result.image_data,
            variation_number: result.variation_number || variation_number,
            post_id: result.post_id || post_id,
            source: source
          }
        })

      if (historyBroadcastError) {
        console.error('Failed to broadcast to history channel:', historyBroadcastError)
      } else {
        console.log('Image data broadcasted to history channel successfully')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image generation triggered successfully',
        data: result 
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
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
