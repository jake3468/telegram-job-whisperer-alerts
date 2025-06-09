
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global execution tracking with much longer windows
const globalExecutionTracker = new Map<string, {
  timestamp: number;
  requestId: string;
  status: 'processing' | 'completed' | 'failed';
  payload: any;
}>();

// Much longer execution window - 5 minutes
const EXECUTION_WINDOW = 300000; // 5 minutes
const CLEANUP_INTERVAL = 600000; // 10 minutes cleanup

// Create a more robust fingerprint
function createRobustFingerprint(payload: any): string {
  const { job_analysis, user, webhook_type, event_type } = payload;
  
  // Create hash of job description to detect exact same submissions
  const jobDescHash = job_analysis?.job_description ? 
    btoa(job_analysis.job_description.substring(0, 200)).replace(/[^a-zA-Z0-9]/g, '') : 'no-desc';
  
  return `${user?.id || user?.clerk_id || 'unknown'}-${job_analysis?.id || 'unknown'}-${webhook_type || event_type || 'unknown'}-${job_analysis?.company_name || ''}-${job_analysis?.job_title || ''}-${jobDescHash}`;
}

// Enhanced logging function with more context
function logExecution(level: string, message: string, data?: any, requestId?: string) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    requestId,
    level,
    message,
    ...data
  };
  console.log(`[${timestamp}] [${level}] [${requestId || 'NO-ID'}] ${message}`, 
    data ? JSON.stringify(logData, null, 2) : '');
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  logExecution('INFO', 'FUNCTION START - Job Analysis Webhook called', {
    method: req.method,
    userAgent: req.headers.get('user-agent'),
    clientInfo: req.headers.get('x-client-info'),
    contentType: req.headers.get('content-type')
  }, requestId);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logExecution('INFO', 'CORS preflight handled', {}, requestId);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the payload from the request
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      logExecution('ERROR', 'Invalid JSON payload', { error: e.message }, requestId);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload', requestId }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logExecution('INFO', 'Payload received and parsed', { 
      payloadKeys: Object.keys(payload),
      jobAnalysisId: payload.job_analysis?.id,
      userId: payload.user?.id || payload.user?.clerk_id,
      webhookType: payload.webhook_type || payload.event_type,
      payloadSize: JSON.stringify(payload).length
    }, requestId);

    // Create robust fingerprint
    const executionFingerprint = createRobustFingerprint(payload);
    const webhookType = payload.webhook_type || payload.event_type || 'cover_letter';
    const executionKey = `${executionFingerprint}-${webhookType}`;
    
    logExecution('INFO', 'Execution fingerprint created', { 
      executionFingerprint,
      executionKey,
      webhookType
    }, requestId);

    const now = Date.now();
    
    // AGGRESSIVE duplicate check - check if we've seen this exact request recently
    if (globalExecutionTracker.has(executionKey)) {
      const lastExecution = globalExecutionTracker.get(executionKey)!;
      const timeDiff = now - lastExecution.timestamp;
      
      logExecution('WARN', 'DUPLICATE DETECTED - Exact execution found', { 
        executionKey,
        timeDiff,
        lastExecutionStatus: lastExecution.status,
        lastRequestId: lastExecution.requestId,
        currentRequestId: requestId
      }, requestId);
      
      // Block ANY duplicate within the window, regardless of status
      if (timeDiff < EXECUTION_WINDOW) {
        logExecution('WARN', 'BLOCKING DUPLICATE - Within execution window', { 
          timeDiff,
          windowSize: EXECUTION_WINDOW
        }, requestId);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Duplicate request blocked - already processed recently', 
            type: webhookType,
            requestId,
            originalRequestId: lastExecution.requestId,
            timeDiff,
            blocked: true,
            reason: 'duplicate_within_window'
          }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Record this execution immediately to prevent race conditions
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'processing',
      payload: payload
    });
    
    logExecution('INFO', 'Execution registered as PROCESSING', { 
      executionKey,
      totalTrackedExecutions: globalExecutionTracker.size
    }, requestId);
    
    // Clean up old executions more aggressively
    let cleanedCount = 0;
    for (const [key, execution] of globalExecutionTracker.entries()) {
      if (now - execution.timestamp > CLEANUP_INTERVAL) {
        globalExecutionTracker.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      logExecution('INFO', 'Cleaned up old executions', { 
        cleanedCount, 
        remainingExecutions: globalExecutionTracker.size 
      }, requestId);
    }
    
    // Determine webhook URL
    const webhookEnvVar = webhookType === 'job_guide' ? 'N8N_JG_WEBHOOK_URL' : 'N8N_CL_WEBHOOK_URL';
    const webhookUrl = Deno.env.get(webhookEnvVar);
    
    if (!webhookUrl) {
      const errorMsg = `${webhookEnvVar} secret not configured`;
      logExecution('ERROR', errorMsg, {}, requestId);
      
      // Mark as failed and remove from tracker
      globalExecutionTracker.delete(executionKey);
      
      return new Response(
        JSON.stringify({ error: errorMsg, requestId }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      logExecution('INFO', 'Checking database for existing results', { 
        jobAnalysisId: payload.job_analysis?.id,
        webhookType
      }, requestId);
      
      // Check if this analysis already has results
      const { data: existingAnalysis, error: checkError } = await supabase
        .from('job_analyses')
        .select(webhookType === 'job_guide' ? 'job_match' : 'cover_letter')
        .eq('id', payload.job_analysis?.id)
        .single();
      
      if (!checkError && existingAnalysis) {
        const resultField = webhookType === 'job_guide' ? 'job_match' : 'cover_letter';
        if (existingAnalysis[resultField]) {
          logExecution('INFO', 'RESULT ALREADY EXISTS - Skipping webhook call', { 
            jobAnalysisId: payload.job_analysis?.id,
            resultField,
            hasResult: !!existingAnalysis[resultField]
          }, requestId);
          
          // Mark as completed
          globalExecutionTracker.set(executionKey, {
            timestamp: now,
            requestId,
            status: 'completed',
            payload: payload
          });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Analysis result already exists - skipped', 
              type: webhookType,
              requestId,
              skipped: true,
              reason: 'result_exists'
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else if (checkError) {
        logExecution('WARN', 'Error checking existing analysis', { error: checkError }, requestId);
      }
    }

    // Add enhanced metadata to payload
    const enhancedPayload = {
      ...payload,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        fingerprint: executionFingerprint,
        executionKey,
        webhookType,
        source: 'supabase-edge-function-v2',
        preventDuplicates: true
      }
    };

    // Forward to n8n webhook with enhanced headers
    logExecution('INFO', 'Sending to n8n webhook', { 
      webhookType, 
      webhookUrl: webhookUrl.substring(0, 50) + '...',
      payloadSize: JSON.stringify(enhancedPayload).length
    }, requestId);
    
    const webhookStartTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Execution-Key': executionKey,
        'X-Webhook-Type': webhookType,
        'X-Prevent-Duplicates': 'true'
      },
      body: JSON.stringify(enhancedPayload),
    });

    const webhookDuration = Date.now() - webhookStartTime;

    if (!response.ok) {
      const errorMsg = `n8n webhook failed (${webhookType})`;
      logExecution('ERROR', errorMsg, { 
        status: response.status, 
        statusText: response.statusText,
        webhookDuration
      }, requestId);
      
      // Remove from tracker to allow retry
      globalExecutionTracker.delete(executionKey);
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook failed', 
          status: response.status,
          statusText: response.statusText,
          requestId
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark as completed
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'completed',
      payload: payload
    });

    const totalDuration = Date.now() - requestStartTime;
    logExecution('INFO', 'SUCCESS - Webhook sent successfully', { 
      webhookType, 
      webhookDuration,
      totalDuration,
      executionKey
    }, requestId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully', 
        type: webhookType,
        requestId,
        duration: totalDuration
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    logExecution('ERROR', 'FATAL ERROR in function', { 
      error: error.message, 
      stack: error.stack,
      totalDuration
    }, requestId);
    
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
