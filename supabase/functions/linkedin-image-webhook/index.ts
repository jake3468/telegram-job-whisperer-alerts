
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Get the N8N webhook URL from environment variables (Supabase secrets are available as env vars)
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
