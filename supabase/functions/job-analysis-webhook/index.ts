
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced in-memory execution tracking with longer windows
const globalExecutionTracker = new Map<string, {
  timestamp: number;
  requestId: string;
  status: 'processing' | 'completed' | 'failed';
  payload: any;
}>();

// Increased execution window to 10 minutes for more robust duplicate prevention
const EXECUTION_WINDOW = 600000; // 10 minutes
const CLEANUP_INTERVAL = 1200000; // 20 minutes cleanup

// Generate cryptographic fingerprint for robust duplicate detection
async function generateCryptoFingerprint(payload: any): Promise<string> {
  const { job_analysis, user, webhook_type, event_type } = payload;
  
  const fingerprintData = {
    user_id: user?.id || user?.clerk_id || 'unknown',
    job_analysis_id: job_analysis?.id || 'unknown',
    webhook_type: webhook_type || event_type || 'unknown',
    company_name: job_analysis?.company_name || '',
    job_title: job_analysis?.job_title || '',
    job_description_hash: job_analysis?.job_description ? 
      btoa(job_analysis.job_description.substring(0, 500)).replace(/[^a-zA-Z0-9]/g, '') : 'no-desc',
    submission_hash: payload.submission_hash || '',
    anti_duplicate_source: payload.anti_duplicate_metadata?.source || 'unknown'
  };

  const encoder = new TextEncoder();
  const dataString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enhanced logging with execution tracking
async function logExecution(supabase: any, level: string, message: string, data?: any, requestId?: string) {
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

  // Store in database for monitoring
  try {
    await supabase.from('execution_logs').insert({
      log_type: level.toLowerCase(),
      data: logData
    });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  // Initialize Supabase client early for logging
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = supabaseUrl && supabaseServiceKey ? 
    createClient(supabaseUrl, supabaseServiceKey) : null;

  if (supabase) {
    await logExecution(supabase, 'INFO', 'FUNCTION START - Job Analysis Webhook called', {
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      clientInfo: req.headers.get('x-client-info'),
      contentType: req.headers.get('content-type')
    }, requestId);
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    if (supabase) {
      await logExecution(supabase, 'INFO', 'CORS preflight handled', {}, requestId);
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse payload with validation
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      if (supabase) {
        await logExecution(supabase, 'ERROR', 'Invalid JSON payload', { error: e.message }, requestId);
      }
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload', requestId }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (supabase) {
      await logExecution(supabase, 'INFO', 'Payload received and parsed', { 
        payloadKeys: Object.keys(payload),
        jobAnalysisId: payload.job_analysis?.id,
        userId: payload.user?.id || payload.user?.clerk_id,
        webhookType: payload.webhook_type || payload.event_type,
        payloadSize: JSON.stringify(payload).length,
        hasAntiDuplicateMetadata: !!payload.anti_duplicate_metadata
      }, requestId);
    }

    // Generate robust fingerprint
    const executionFingerprint = await generateCryptoFingerprint(payload);
    const webhookType = payload.webhook_type || payload.event_type || 'cover_letter';
    const executionKey = `${executionFingerprint}-${webhookType}`;
    
    if (supabase) {
      await logExecution(supabase, 'INFO', 'Execution fingerprint created', { 
        executionFingerprint,
        executionKey,
        webhookType
      }, requestId);
    }

    const now = Date.now();
    
    // LAYER 1: In-memory duplicate check
    if (globalExecutionTracker.has(executionKey)) {
      const lastExecution = globalExecutionTracker.get(executionKey)!;
      const timeDiff = now - lastExecution.timestamp;
      
      if (supabase) {
        await logExecution(supabase, 'WARN', 'DUPLICATE DETECTED - In-memory cache hit', { 
          executionKey,
          timeDiff,
          lastExecutionStatus: lastExecution.status,
          lastRequestId: lastExecution.requestId,
          currentRequestId: requestId
        }, requestId);
      }
      
      if (timeDiff < EXECUTION_WINDOW) {
        if (supabase) {
          await logExecution(supabase, 'WARN', 'BLOCKING DUPLICATE - Within execution window', { 
            timeDiff,
            windowSize: EXECUTION_WINDOW
          }, requestId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Duplicate request blocked - in-memory cache', 
            type: webhookType,
            requestId,
            originalRequestId: lastExecution.requestId,
            timeDiff,
            blocked: true,
            reason: 'in_memory_duplicate'
          }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // LAYER 2: Database-level duplicate check using new tracking table
    if (supabase) {
      const { data: existingExecution, error: checkError } = await supabase
        .from('webhook_executions')
        .select('id, executed_at, status, request_type')
        .eq('fingerprint', executionFingerprint)
        .gte('executed_at', new Date(now - EXECUTION_WINDOW).toISOString())
        .order('executed_at', { ascending: false })
        .limit(1);

      if (!checkError && existingExecution && existingExecution.length > 0) {
        const existing = existingExecution[0];
        await logExecution(supabase, 'WARN', 'DUPLICATE DETECTED - Database level', { 
          executionFingerprint,
          existingExecution: existing,
          timeSinceExecution: now - new Date(existing.executed_at).getTime()
        }, requestId);

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Duplicate request blocked - database level', 
            type: webhookType,
            requestId,
            existingExecution: existing,
            blocked: true,
            reason: 'database_duplicate'
          }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (checkError) {
        await logExecution(supabase, 'WARN', 'Error checking database for duplicates', { error: checkError }, requestId);
      }
    }
    
    // LAYER 3: Check if analysis already has results (skip webhook if result exists)
    if (supabase && payload.job_analysis?.id) {
      await logExecution(supabase, 'INFO', 'Checking database for existing results', { 
        jobAnalysisId: payload.job_analysis?.id,
        webhookType
      }, requestId);
      
      const { data: existingAnalysis, error: resultCheckError } = await supabase
        .from('job_analyses')
        .select(webhookType === 'job_guide' ? 'job_match' : 'cover_letter')
        .eq('id', payload.job_analysis?.id)
        .single();
      
      if (!resultCheckError && existingAnalysis) {
        const resultField = webhookType === 'job_guide' ? 'job_match' : 'cover_letter';
        if (existingAnalysis[resultField]) {
          await logExecution(supabase, 'INFO', 'RESULT ALREADY EXISTS - Skipping webhook call', { 
            jobAnalysisId: payload.job_analysis?.id,
            resultField,
            hasResult: !!existingAnalysis[resultField]
          }, requestId);
          
          // Record execution as completed (no webhook needed)
          globalExecutionTracker.set(executionKey, {
            timestamp: now,
            requestId,
            status: 'completed',
            payload: payload
          });

          if (supabase) {
            await supabase.from('webhook_executions').insert({
              fingerprint: executionFingerprint,
              submission_id: payload.submission_id || payload.request_id,
              record_id: payload.job_analysis?.id,
              request_type: webhookType,
              status: 'completed',
              webhook_response: 'Result already exists - skipped'
            });
          }
          
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
      } else if (resultCheckError) {
        await logExecution(supabase, 'WARN', 'Error checking existing analysis', { error: resultCheckError }, requestId);
      }
    }
    
    // Record this execution immediately to prevent race conditions
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'processing',
      payload: payload
    });

    // Record in database
    if (supabase) {
      const { error: insertError } = await supabase.from('webhook_executions').insert({
        fingerprint: executionFingerprint,
        submission_id: payload.submission_id || payload.request_id || payload.anti_duplicate_metadata?.submission_time?.toString(),
        record_id: payload.job_analysis?.id,
        request_type: webhookType,
        status: 'processing'
      });

      if (insertError) {
        await logExecution(supabase, 'ERROR', 'Failed to record execution in database', { error: insertError }, requestId);
      } else {
        await logExecution(supabase, 'INFO', 'Execution recorded in database', { executionFingerprint }, requestId);
      }
    }
    
    if (supabase) {
      await logExecution(supabase, 'INFO', 'Execution registered as PROCESSING', { 
        executionKey,
        totalTrackedExecutions: globalExecutionTracker.size
      }, requestId);
    }
    
    // Clean up old executions more aggressively
    let cleanedCount = 0;
    for (const [key, execution] of globalExecutionTracker.entries()) {
      if (now - execution.timestamp > CLEANUP_INTERVAL) {
        globalExecutionTracker.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0 && supabase) {
      await logExecution(supabase, 'INFO', 'Cleaned up old in-memory executions', { 
        cleanedCount, 
        remainingExecutions: globalExecutionTracker.size 
      }, requestId);
    }
    
    // Determine webhook URL
    const webhookEnvVar = webhookType === 'job_guide' ? 'N8N_JG_WEBHOOK_URL' : 'N8N_CL_WEBHOOK_URL';
    const webhookUrl = Deno.env.get(webhookEnvVar);
    
    if (!webhookUrl) {
      const errorMsg = `${webhookEnvVar} secret not configured`;
      if (supabase) {
        await logExecution(supabase, 'ERROR', errorMsg, {}, requestId);
      }
      
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

    // Add enhanced metadata to payload
    const enhancedPayload = {
      ...payload,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        fingerprint: executionFingerprint,
        executionKey,
        webhookType,
        source: 'supabase-edge-function-v3',
        preventDuplicates: true,
        submissionId: payload.submission_id || payload.request_id,
        antiDuplicateMetadata: payload.anti_duplicate_metadata
      }
    };

    // Forward to n8n webhook with enhanced headers
    if (supabase) {
      await logExecution(supabase, 'INFO', 'Sending to n8n webhook', { 
        webhookType, 
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        payloadSize: JSON.stringify(enhancedPayload).length
      }, requestId);
    }
    
    const webhookStartTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Execution-Key': executionKey,
        'X-Webhook-Type': webhookType,
        'X-Prevent-Duplicates': 'true',
        'X-Fingerprint': executionFingerprint,
        'X-Source': 'supabase-edge-function-v3'
      },
      body: JSON.stringify(enhancedPayload),
    });

    const webhookDuration = Date.now() - webhookStartTime;
    const responseText = await response.text();

    // Update execution status in database
    if (supabase) {
      await supabase.from('webhook_executions')
        .update({ 
          status: response.ok ? 'completed' : 'failed',
          webhook_response: responseText.substring(0, 1000), // Limit response size
          completed_at: new Date().toISOString()
        })
        .eq('fingerprint', executionFingerprint);
    }

    if (!response.ok) {
      const errorMsg = `n8n webhook failed (${webhookType})`;
      if (supabase) {
        await logExecution(supabase, 'ERROR', errorMsg, { 
          status: response.status, 
          statusText: response.statusText,
          responseText: responseText.substring(0, 500),
          webhookDuration
        }, requestId);
      }
      
      // Mark as failed in tracker
      globalExecutionTracker.set(executionKey, {
        timestamp: now,
        requestId,
        status: 'failed',
        payload: payload
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook failed', 
          status: response.status,
          statusText: response.statusText,
          requestId,
          responseText: responseText.substring(0, 200)
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
    if (supabase) {
      await logExecution(supabase, 'INFO', 'SUCCESS - Webhook sent successfully', { 
        webhookType, 
        webhookDuration,
        totalDuration,
        executionKey,
        responsePreview: responseText.substring(0, 100)
      }, requestId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully', 
        type: webhookType,
        requestId,
        duration: totalDuration,
        fingerprint: executionFingerprint
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    if (supabase) {
      await logExecution(supabase, 'ERROR', 'FATAL ERROR in function', { 
        error: error.message, 
        stack: error.stack,
        totalDuration
      }, requestId);
    }
    
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
