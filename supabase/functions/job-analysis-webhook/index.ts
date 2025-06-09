
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced tracking for duplicate prevention
const recentExecutions = new Map<string, {
  timestamp: number;
  requestId: string;
  status: 'processing' | 'completed' | 'failed';
}>();

const EXECUTION_WINDOW = 60000; // 60 seconds window to prevent duplicates
const CLEANUP_INTERVAL = 300000; // 5 minutes cleanup interval

// Request fingerprinting for enhanced duplicate detection
function createRequestFingerprint(payload: any): string {
  const { job_analysis, user, webhook_type } = payload;
  return `${user?.id || 'unknown'}-${job_analysis?.id || 'unknown'}-${webhook_type || 'unknown'}-${job_analysis?.company_name || ''}-${job_analysis?.job_title || ''}`;
}

// Enhanced logging function
function logExecution(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  logExecution('INFO', 'Job Analysis Webhook function called', {
    requestId,
    method: req.method,
    userAgent: req.headers.get('user-agent'),
    clientInfo: req.headers.get('x-client-info')
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logExecution('INFO', 'CORS preflight request handled', { requestId });
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the payload from the request
    const payload = await req.json();
    logExecution('INFO', 'Received payload', { 
      requestId, 
      payloadKeys: Object.keys(payload),
      jobAnalysisId: payload.job_analysis?.id,
      userId: payload.user?.id,
      webhookType: payload.webhook_type
    });

    // Create request fingerprint for enhanced duplicate detection
    const requestFingerprint = createRequestFingerprint(payload);
    logExecution('INFO', 'Request fingerprint created', { requestId, requestFingerprint });

    // Determine which webhook to use based on the webhook_type in payload
    const webhookType = payload.webhook_type || 'cover_letter';
    const webhookEnvVar = webhookType === 'job_guide' ? 'N8N_JG_WEBHOOK_URL' : 'N8N_CL_WEBHOOK_URL';
    
    // Enhanced execution key with request fingerprint
    const executionKey = `${requestFingerprint}-${webhookType}`;
    const now = Date.now();
    
    logExecution('INFO', 'Checking for duplicate executions', { 
      requestId, 
      executionKey,
      existingExecution: recentExecutions.has(executionKey)
    });

    // Check if this exact request was made recently with enhanced tracking
    if (recentExecutions.has(executionKey)) {
      const lastExecution = recentExecutions.get(executionKey)!;
      const timeDiff = now - lastExecution.timestamp;
      
      logExecution('WARN', 'Potential duplicate execution detected', { 
        requestId, 
        executionKey,
        timeDiff,
        lastExecutionStatus: lastExecution.status,
        lastRequestId: lastExecution.requestId
      });
      
      if (timeDiff < EXECUTION_WINDOW) {
        if (lastExecution.status === 'processing') {
          logExecution('WARN', 'Blocking duplicate - request still processing', { requestId, executionKey });
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Request already being processed', 
              type: webhookType,
              requestId,
              originalRequestId: lastExecution.requestId,
              skipped: true 
            }), 
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else if (lastExecution.status === 'completed') {
          logExecution('WARN', 'Blocking duplicate - request already completed', { requestId, executionKey });
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Request already processed successfully', 
              type: webhookType,
              requestId,
              originalRequestId: lastExecution.requestId,
              skipped: true 
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }
    
    // Record this execution as processing
    recentExecutions.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'processing'
    });
    
    logExecution('INFO', 'Execution recorded as processing', { requestId, executionKey });
    
    // Clean up old executions
    const cleanupStartTime = Date.now();
    let cleanedCount = 0;
    for (const [key, execution] of recentExecutions.entries()) {
      if (now - execution.timestamp > CLEANUP_INTERVAL) {
        recentExecutions.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      logExecution('INFO', 'Cleaned up old executions', { requestId, cleanedCount, cleanupTime: Date.now() - cleanupStartTime });
    }
    
    // Get the webhook URL from edge function secrets
    const webhookUrl = Deno.env.get(webhookEnvVar);
    
    if (!webhookUrl) {
      const errorMsg = `${webhookEnvVar} secret not configured`;
      logExecution('ERROR', errorMsg, { requestId });
      
      // Mark as failed
      recentExecutions.set(executionKey, {
        timestamp: now,
        requestId,
        status: 'failed'
      });
      
      return new Response(
        JSON.stringify({ error: errorMsg, requestId }), 
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
      
      logExecution('INFO', 'Checking database for existing results', { requestId, jobAnalysisId: payload.job_analysis?.id });
      
      // Check if this analysis already has the corresponding result field populated
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select(webhookType === 'job_guide' ? 'job_match' : 'cover_letter')
        .eq('id', payload.job_analysis?.id)
        .single();
      
      if (!checkError && existingAnalysis) {
        const resultField = webhookType === 'job_guide' ? 'job_match' : 'cover_letter';
        if (existingAnalysis[resultField]) {
          logExecution('INFO', 'Analysis already has result - skipping webhook', { 
            requestId, 
            jobAnalysisId: payload.job_analysis?.id,
            resultField,
            hasResult: !!existingAnalysis[resultField]
          });
          
          // Mark as completed
          recentExecutions.set(executionKey, {
            timestamp: now,
            requestId,
            status: 'completed'
          });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Analysis already processed', 
              type: webhookType,
              requestId,
              skipped: true 
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else if (checkError) {
        logExecution('WARN', 'Error checking existing analysis', { requestId, error: checkError });
      }
    }

    // Add additional metadata to payload for tracking
    const enhancedPayload = {
      ...payload,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        fingerprint: requestFingerprint,
        executionKey,
        webhookType,
        source: 'supabase-edge-function'
      }
    };

    // Forward the payload to n8n webhook
    logExecution('INFO', 'Sending payload to n8n webhook', { 
      requestId, 
      webhookType, 
      webhookUrl: webhookUrl.substring(0, 50) + '...',
      payloadSize: JSON.stringify(enhancedPayload).length
    });
    
    const webhookStartTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Execution-Key': executionKey
      },
      body: JSON.stringify(enhancedPayload),
    });

    const webhookDuration = Date.now() - webhookStartTime;

    if (!response.ok) {
      const errorMsg = `Failed to send webhook to n8n (${webhookType})`;
      logExecution('ERROR', errorMsg, { 
        requestId, 
        status: response.status, 
        statusText: response.statusText,
        webhookDuration,
        executionKey
      });
      
      // Mark as failed and remove from recent executions to allow retry
      recentExecutions.delete(executionKey);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send webhook', 
          status: response.status,
          statusText: response.statusText,
          requestId,
          executionKey
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark as completed
    recentExecutions.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'completed'
    });

    const totalDuration = Date.now() - requestStartTime;
    logExecution('INFO', 'Successfully sent webhook to n8n', { 
      requestId, 
      webhookType, 
      executionKey,
      webhookDuration,
      totalDuration
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully', 
        type: webhookType,
        requestId,
        executionKey,
        duration: totalDuration
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    logExecution('ERROR', 'Error in job-analysis-webhook function', { 
      requestId, 
      error: error.message, 
      stack: error.stack,
      totalDuration
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        requestId,
        duration: totalDuration
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
