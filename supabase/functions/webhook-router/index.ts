
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
    console.log('Webhook router triggered');
    
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Determine webhook type and get appropriate N8N URL
    let n8nWebhookUrl;
    const webhookType = payload.webhook_type;
    
    console.log('Webhook type:', webhookType);

    switch (webhookType) {
      case 'job_guide':
        n8nWebhookUrl = Deno.env.get('N8N_JG_WEBHOOK_URL');
        console.log('Using Job Guide webhook URL');
        break;
      case 'cover_letter':
        n8nWebhookUrl = Deno.env.get('N8N_CL_WEBHOOK_URL');
        console.log('Using Cover Letter webhook URL');
        break;
      case 'linkedin_post':
        n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_WEBHOOK_URL');
        console.log('Using LinkedIn webhook URL');
        break;
      case 'company_analysis':
        n8nWebhookUrl = Deno.env.get('N8N_COMPANY_WEBHOOK_URL');
        console.log('Using Company Analysis webhook URL');
        break;
      case 'interview_prep':
        n8nWebhookUrl = Deno.env.get('N8N_INTERVIEW_WEBHOOK_URL');
        console.log('Using Interview Prep webhook URL');
        break;
      default:
        console.error('Unknown webhook type:', webhookType);
        return new Response('Unknown webhook type', { 
          status: 400, 
          headers: corsHeaders 
        });
    }
    
    if (!n8nWebhookUrl) {
      console.error(`N8N webhook URL not configured for type: ${webhookType}`);
      return new Response('Webhook URL not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log(`Calling N8N webhook for ${webhookType}:`, n8nWebhookUrl);

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

    return new Response(`${webhookType} webhook processed successfully`, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
