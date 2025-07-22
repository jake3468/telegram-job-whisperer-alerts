
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
    console.log('Resume PDF webhook triggered');
    
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const n8nWebhookUrl = Deno.env.get('N8N_RESUME_PDF_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_RESUME_PDF_WEBHOOK_URL not configured');
      // Return success anyway to not block user experience
      return new Response('Webhook URL not configured but continuing', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    try {
      // Forward the payload to N8N webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('N8N webhook response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('N8N webhook error:', errorText);
        // Log error but don't fail the request
        return new Response('Webhook forwarded with errors', { 
          status: 200, 
          headers: corsHeaders 
        });
      }

      const responseData = await response.text();
      console.log('N8N webhook response:', responseData);

      return new Response('Resume PDF webhook processed successfully', { 
        status: 200, 
        headers: corsHeaders 
      });

    } catch (fetchError) {
      console.error('N8N webhook fetch error:', fetchError);
      // Log error but return success to not block user experience
      return new Response('Webhook processing completed with network issues', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

  } catch (error) {
    console.error('Error processing resume PDF webhook:', error);
    // Still return 200 to not block user workflow
    return new Response('Resume upload noted, processing in background', { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});
