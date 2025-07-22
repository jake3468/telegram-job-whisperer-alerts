
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('[ResumeWebhook] Processing resume PDF webhook...');
    
    const payload = await req.json();
    console.log('[ResumeWebhook] Payload received:', JSON.stringify({
      event_type: payload.event_type,
      user_id: payload.user?.id,
      retry_count: payload.retry_count || 0,
      has_resume: !!payload.resume
    }));

    const n8nWebhookUrl = Deno.env.get('N8N_RESUME_PDF_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('[ResumeWebhook] N8N_RESUME_PDF_WEBHOOK_URL not configured');
      // Return success to prevent blocking user experience
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Webhook URL not configured but request noted',
        processed: false 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[ResumeWebhook] Forwarding to N8N webhook:', n8nWebhookUrl.substring(0, 50) + '...');

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[ResumeWebhook] Request timeout after 15 seconds');
        controller.abort();
      }, 15000); // 15 second timeout

      // Enhanced payload with processing metadata
      const enhancedPayload = {
        ...payload,
        webhook_metadata: {
          processed_at: new Date().toISOString(),
          retry_count: payload.retry_count || 0,
          max_retries: payload.max_retries || 3,
          timeout_seconds: 15,
          source: 'supabase-edge-function'
        }
      };

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'X-Retry-Count': String(payload.retry_count || 0),
          'X-Source': 'resume-webhook-v2'
        },
        body: JSON.stringify(enhancedPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('[ResumeWebhook] N8N response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('[ResumeWebhook] N8N webhook error response:', errorText);
        
        // Return success but log the issue to prevent user-facing errors
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Resume noted, processing may be delayed',
          processed: false,
          error: 'Downstream processing error'
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responseData = await response.text().catch(() => 'Success');
      console.log('[ResumeWebhook] N8N webhook success response:', responseData.substring(0, 200));

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Resume PDF webhook processed successfully',
        processed: true,
        response_preview: responseData.substring(0, 100)
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error('[ResumeWebhook] N8N webhook fetch error:', errorMessage);
      
      // Check if it's a timeout error
      const isTimeout = errorMessage.includes('aborted') || errorMessage.includes('timeout');
      
      // Return success to prevent blocking user workflow, but log the issue
      return new Response(JSON.stringify({ 
        success: true, 
        message: isTimeout 
          ? 'Resume uploaded, processing may take longer than usual' 
          : 'Resume uploaded, processing in background',
        processed: false,
        error_type: isTimeout ? 'timeout' : 'network',
        retry_recommended: true
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ResumeWebhook] Error processing resume PDF webhook:', errorMessage);
    
    // Always return 200 to prevent blocking user workflow
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Resume upload noted, processing in background',
      processed: false,
      error: 'Processing error'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
