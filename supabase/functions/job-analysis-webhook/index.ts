
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Track recent webhook executions to prevent duplicates
const recentExecutions = new Map<string, number>();
const EXECUTION_WINDOW = 30000; // 30 seconds window to prevent duplicates

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
    
    // Create a unique key for this execution
    const executionKey = `${payload.job_analysis?.id}-${webhookType}-${payload.user?.id}`;
    const now = Date.now();
    
    // Check if this exact request was made recently
    if (recentExecutions.has(executionKey)) {
      const lastExecution = recentExecutions.get(executionKey)!;
      if (now - lastExecution < EXECUTION_WINDOW) {
        console.log(`Duplicate webhook execution detected for key: ${executionKey}. Skipping.`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Duplicate execution prevented', 
            type: webhookType,
            skipped: true 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Record this execution
    recentExecutions.set(executionKey, now);
    
    // Clean up old executions (older than 5 minutes)
    const fiveMinutesAgo = now - 300000;
    for (const [key, timestamp] of recentExecutions.entries()) {
      if (timestamp < fiveMinutesAgo) {
        recentExecutions.delete(key);
      }
    }
    
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

    // Initialize Supabase client to check for existing webhook executions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Check if this analysis already has the corresponding result field populated
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select(webhookType === 'job_guide' ? 'job_match' : 'cover_letter')
        .eq('id', payload.job_analysis?.id)
        .single();
      
      if (!checkError && existingAnalysis) {
        const resultField = webhookType === 'job_guide' ? 'job_match' : 'cover_letter';
        if (existingAnalysis[resultField]) {
          console.log(`Analysis ${payload.job_analysis?.id} already has ${resultField} result. Skipping webhook.`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Analysis already processed', 
              type: webhookType,
              skipped: true 
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
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
      // Remove from recent executions since it failed
      recentExecutions.delete(executionKey);
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

    console.log(`Successfully sent webhook to n8n (${webhookType}) for execution key: ${executionKey}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully', 
        type: webhookType,
        executionKey: executionKey 
      }), 
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
