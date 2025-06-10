
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
      return new Response('Webhook URL not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Forward the payload to N8N webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('N8N webhook response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N webhook error:', errorText);
      return new Response('Failed to forward to N8N webhook', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const responseData = await response.text();
    console.log('N8N webhook response:', responseData);

    return new Response('Resume PDF webhook processed successfully', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing resume PDF webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
