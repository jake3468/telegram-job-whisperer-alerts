
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Job Analysis Webhook function called');
    
    // Get the payload from the request
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Determine which webhook to use based on the webhook_type in payload
    const webhookType = payload.webhook_type || 'cover_letter'; // default to cover letter for backward compatibility
    const webhookEnvVar = webhookType === 'job_guide' ? 'N8N_JG_WEBHOOK_URL' : 'N8N_CL_WEBHOOK_URL';
    
    // Get the webhook URL from edge function secrets
    const webhookUrl = Deno.env.get(webhookEnvVar);
    
    if (!webhookUrl) {
      console.error(`${webhookEnvVar} secret not configured`);
      return new Response(
        JSON.stringify({ error: `${webhookEnvVar} not configured` }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Forward the payload to n8n webhook
    console.log(`Sending payload to n8n webhook (${webhookType}):`, webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to send webhook to n8n (${webhookType}):`, response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send webhook', 
          status: response.status,
          statusText: response.statusText 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully sent webhook to n8n (${webhookType})`);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully', type: webhookType }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in job-analysis-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
