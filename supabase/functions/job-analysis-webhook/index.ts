
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced global execution tracking with longer windows and better cleanup
const globalExecutionTracker = new Map<string, {
  timestamp: number;
  requestId: string;
  status: 'processing' | 'completed' | 'failed';
  payload: any;
  executionId: string;
  webhookType: string;
}>();

// Execution tracking with abort controllers for cleanup
const activeExecutions = new Map<string, AbortController>();

// Enhanced execution windows and cleanup intervals
const EXECUTION_WINDOW = 900000; // 15 minutes for extra safety
const CLEANUP_INTERVAL = 1800000; // 30 minutes cleanup
const MAX_EXECUTION_TIME = 300000; // 5 minutes max execution time

// Enhanced cryptographic fingerprint generation for both types
async function generateEnhancedFingerprint(payload: any): Promise<string> {
  const { job_analysis, job_cover_letter, user, webhook_type, event_type, anti_duplicate_metadata } = payload;
  
  // Handle both job analysis and cover letter payloads
  const analysisData = job_analysis || job_cover_letter;
  
  const fingerprintData = {
    user_id: user?.id || user?.clerk_id || 'unknown',
    record_id: analysisData?.id || 'unknown',
    webhook_type: webhook_type || event_type || 'unknown',
    company_name: analysisData?.company_name || '',
    job_title: analysisData?.job_title || '',
    job_description_hash: analysisData?.job_description ? 
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(analysisData.job_description.substring(0, 500))) : 'no-desc',
    execution_id: anti_duplicate_metadata?.execution_id || '',
    trigger_source: anti_duplicate_metadata?.trigger_source || 'unknown',
    created_at_epoch: analysisData?.created_at ? 
      Math.floor(new Date(analysisData.created_at).getTime() / 60000) : 0 // Round to minute
  };

  const encoder = new TextEncoder();
  const dataString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Enhanced logging with better structure and monitoring
async function logExecutionEnhanced(supabase: any, level: string, message: string, data?: any, requestId?: string) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    requestId,
    level,
    message,
    execution_count: globalExecutionTracker.size,
    active_executions: activeExecutions.size,
    ...data
  };
  
  console.log(`[${timestamp}] [${level}] [${requestId || 'NO-ID'}] ${message}`, 
    data ? JSON.stringify(logData, null, 2) : '');

  // Store in database for monitoring with error handling
  try {
    await supabase.from('execution_logs').insert({
      log_type: level.toLowerCase(),
      data: logData
    });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

// Enhanced cleanup with better memory management
function performEnhancedCleanup() {
  const now = Date.now();
  let cleanedExecutions = 0;
  let cleanedAbortControllers = 0;

  // Clean up old executions
  for (const [key, execution] of globalExecutionTracker.entries()) {
    if (now - execution.timestamp > CLEANUP_INTERVAL) {
      globalExecutionTracker.delete(key);
      cleanedExecutions++;
    }
  }

  // Clean up old abort controllers
  for (const [key, controller] of activeExecutions.entries()) {
    if (!globalExecutionTracker.has(key)) {
      controller.abort();
      activeExecutions.delete(key);
      cleanedAbortControllers++;
    }
  }

  if (cleanedExecutions > 0 || cleanedAbortControllers > 0) {
    console.log(`🧹 Cleanup completed: ${cleanedExecutions} executions, ${cleanedAbortControllers} controllers`);
  }

  return { cleanedExecutions, cleanedAbortControllers };
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
    await logExecutionEnhanced(supabase, 'INFO', 'FUNCTION START - Enhanced Webhook called for both Job Analysis and Cover Letter', {
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      clientInfo: req.headers.get('x-client-info'),
      contentType: req.headers.get('content-type'),
      executionId: req.headers.get('x-execution-id'),
      fingerprint: req.headers.get('x-fingerprint'),
      webhookType: req.headers.get('x-webhook-type')
    }, requestId);
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'CORS preflight handled', {}, requestId);
    }
    return new Response(null, { headers: corsHeaders });
  }

  // Create abort controller for this execution
  const abortController = new AbortController();
  let fingerprint = '';

  try {
    // Parse payload with enhanced validation
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      if (supabase) {
        await logExecutionEnhanced(supabase, 'ERROR', 'Invalid JSON payload', { error: e.message }, requestId);
      }
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload', requestId }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Determine webhook type and table
    const webhookType = payload.webhook_type || payload.event_type || 'unknown';
    const isJobAnalysis = webhookType === 'job_guide' || payload.job_analysis;
    const isCoverLetter = webhookType === 'cover_letter' || payload.job_cover_letter;

    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced payload received and parsed', { 
        payloadKeys: Object.keys(payload),
        isJobAnalysis,
        isCoverLetter,
        webhookType,
        recordId: payload.job_analysis?.id || payload.job_cover_letter?.id,
        userId: payload.user?.id || payload.user?.clerk_id,
        payloadSize: JSON.stringify(payload).length,
        hasAntiDuplicateMetadata: !!payload.anti_duplicate_metadata,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        triggerSource: payload.anti_duplicate_metadata?.trigger_source
      }, requestId);
    }

    // Generate enhanced fingerprint
    fingerprint = await generateEnhancedFingerprint(payload);
    const executionKey = `${fingerprint}-${webhookType}`;
    
    // Register abort controller
    activeExecutions.set(executionKey, abortController);

    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced execution fingerprint created', { 
        fingerprint,
        executionKey,
        webhookType,
        isJobAnalysis,
        isCoverLetter,
        databaseExecutionId: payload.anti_duplicate_metadata?.execution_id
      }, requestId);
    }

    const now = Date.now();
    
    // LAYER 1: Enhanced in-memory duplicate check
    if (globalExecutionTracker.has(executionKey)) {
      const lastExecution = globalExecutionTracker.get(executionKey)!;
      const timeDiff = now - lastExecution.timestamp;
      
      if (supabase) {
        await logExecutionEnhanced(supabase, 'WARN', 'DUPLICATE DETECTED - Enhanced in-memory cache hit', { 
          executionKey,
          timeDiff,
          lastExecutionStatus: lastExecution.status,
          lastRequestId: lastExecution.requestId,
          lastExecutionId: lastExecution.executionId,
          currentRequestId: requestId,
          webhookType: lastExecution.webhookType
        }, requestId);
      }
      
      if (timeDiff < EXECUTION_WINDOW) {
        if (supabase) {
          await logExecutionEnhanced(supabase, 'WARN', 'BLOCKING DUPLICATE - Within enhanced execution window', { 
            timeDiff,
            windowSize: EXECUTION_WINDOW,
            webhookType
          }, requestId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Duplicate request blocked - enhanced in-memory cache', 
            type: webhookType,
            requestId,
            originalRequestId: lastExecution.requestId,
            originalExecutionId: lastExecution.executionId,
            timeDiff,
            blocked: true,
            reason: 'enhanced_in_memory_duplicate'
          }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // LAYER 2: Enhanced database-level duplicate check using atomic function
    if (supabase) {
      const recordId = payload.job_analysis?.id || payload.job_cover_letter?.id;
      const functionName = isCoverLetter ? 'check_and_insert_cover_letter_execution' : 'check_and_insert_execution';
      const requestType = isCoverLetter ? 'cover_letter_created' : 'job_analysis_created';
      
      const { data: atomicResult, error: atomicError } = await supabase.rpc(
        functionName,
        {
          p_fingerprint: fingerprint,
          p_record_id: recordId,
          p_submission_id: payload.submission_id || payload.request_id,
          p_request_type: requestType,
          p_check_minutes: 15 // Extended check window
        }
      );

      if (atomicError) {
        await logExecutionEnhanced(supabase, 'ERROR', 'Atomic function error', { 
          error: atomicError,
          functionName,
          webhookType
        }, requestId);
      } else if (atomicResult === 'DUPLICATE') {
        await logExecutionEnhanced(supabase, 'WARN', 'DUPLICATE DETECTED - Enhanced atomic database level', { 
          fingerprint,
          atomicResult,
          webhookType,
          functionName
        }, requestId);

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Duplicate request blocked - enhanced atomic database level', 
            type: webhookType,
            requestId,
            blocked: true,
            reason: 'enhanced_atomic_duplicate'
          }), 
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        await logExecutionEnhanced(supabase, 'INFO', 'Atomic execution registered successfully', { 
          atomicResult,
          fingerprint,
          webhookType,
          functionName
        }, requestId);
      }
    }
    
    // LAYER 3: Enhanced existing results check
    if (supabase && (payload.job_analysis?.id || payload.job_cover_letter?.id)) {
      const tableName = isJobAnalysis ? 'job_analyses' : 'job_cover_letters';
      const resultField = isJobAnalysis ? 'job_match' : 'cover_letter';
      const recordId = payload.job_analysis?.id || payload.job_cover_letter?.id;
      
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced checking database for existing results', { 
        recordId,
        webhookType,
        tableName,
        resultField
      }, requestId);
      
      const { data: existingRecord, error: resultCheckError } = await supabase
        .from(tableName)
        .select(resultField)
        .eq('id', recordId)
        .single();
      
      if (!resultCheckError && existingRecord) {
        if (existingRecord[resultField]) {
          await logExecutionEnhanced(supabase, 'INFO', 'RESULT ALREADY EXISTS - Enhanced skipping webhook call', { 
            recordId,
            resultField,
            hasResult: !!existingRecord[resultField],
            webhookType,
            tableName
          }, requestId);
          
          // Record execution as completed (no webhook needed)
          globalExecutionTracker.set(executionKey, {
            timestamp: now,
            requestId,
            status: 'completed',
            payload: payload,
            executionId: payload.anti_duplicate_metadata?.execution_id || 'result-exists',
            webhookType
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Enhanced ${webhookType} result already exists - skipped`, 
              type: webhookType,
              requestId,
              skipped: true,
              reason: 'enhanced_result_exists'
            }), 
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else if (resultCheckError) {
        await logExecutionEnhanced(supabase, 'WARN', 'Error checking existing record', { 
          error: resultCheckError,
          tableName,
          webhookType
        }, requestId);
      }
    }
    
    // Record enhanced execution immediately with better tracking
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'processing',
      payload: payload,
      executionId: payload.anti_duplicate_metadata?.execution_id || requestId,
      webhookType
    });

    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced execution registered as PROCESSING', { 
        executionKey,
        totalTrackedExecutions: globalExecutionTracker.size,
        activeExecutions: activeExecutions.size,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        webhookType
      }, requestId);
    }
    
    // Enhanced cleanup with better timing
    const cleanupStats = performEnhancedCleanup();
    if (supabase && (cleanupStats.cleanedExecutions > 0 || cleanupStats.cleanedAbortControllers > 0)) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced cleanup completed', cleanupStats, requestId);
    }
    
    // Determine webhook URL with enhanced validation
    const webhookEnvVar = isJobAnalysis ? 'N8N_JG_WEBHOOK_URL' : 'N8N_CL_WEBHOOK_URL';
    const webhookUrl = Deno.env.get(webhookEnvVar);
    
    if (!webhookUrl) {
      const errorMsg = `Enhanced ${webhookEnvVar} secret not configured`;
      if (supabase) {
        await logExecutionEnhanced(supabase, 'ERROR', errorMsg, { webhookType }, requestId);
      }
      
      // Mark as failed and remove from tracker
      globalExecutionTracker.delete(executionKey);
      activeExecutions.delete(executionKey);
      
      return new Response(
        JSON.stringify({ error: errorMsg, requestId, webhookType }), 
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
        fingerprint,
        executionKey,
        webhookType,
        source: 'supabase-edge-function-separated-v1',
        preventDuplicates: true,
        submissionId: payload.submission_id || payload.request_id,
        antiDuplicateMetadata: payload.anti_duplicate_metadata,
        enhancedDuplicatePrevention: true,
        executionWindow: EXECUTION_WINDOW,
        databaseExecutionId: payload.anti_duplicate_metadata?.execution_id,
        triggerSource: payload.anti_duplicate_metadata?.trigger_source,
        isJobAnalysis,
        isCoverLetter
      }
    };

    // Forward to N8N webhook with enhanced headers and timeout protection
    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Sending to enhanced N8N webhook', { 
        webhookType, 
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        payloadSize: JSON.stringify(enhancedPayload).length,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        isJobAnalysis,
        isCoverLetter
      }, requestId);
    }
    
    const webhookStartTime = Date.now();
    
    // Enhanced webhook call with abort signal and timeout
    const webhookPromise = fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Execution-Key': executionKey,
        'X-Webhook-Type': webhookType,
        'X-Prevent-Duplicates': 'true',
        'X-Fingerprint': fingerprint,
        'X-Source': 'supabase-edge-function-separated-v1',
        'X-Database-Execution-ID': payload.anti_duplicate_metadata?.execution_id || '',
        'X-Trigger-Source': payload.anti_duplicate_metadata?.trigger_source || '',
        'X-Is-Job-Analysis': isJobAnalysis.toString(),
        'X-Is-Cover-Letter': isCoverLetter.toString()
      },
      body: JSON.stringify(enhancedPayload),
      signal: abortController.signal
    });

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Webhook timeout')), MAX_EXECUTION_TIME);
    });

    const response = await Promise.race([webhookPromise, timeoutPromise]) as Response;
    const webhookDuration = Date.now() - webhookStartTime;
    const responseText = await response.text();

    // Update execution status in database with enhanced tracking
    if (supabase) {
      await supabase.from('webhook_executions')
        .update({ 
          status: response.ok ? 'completed' : 'failed',
          webhook_response: responseText.substring(0, 1000),
          completed_at: new Date().toISOString()
        })
        .eq('fingerprint', fingerprint);
    }

    if (!response.ok) {
      const errorMsg = `Enhanced N8N webhook failed (${webhookType})`;
      if (supabase) {
        await logExecutionEnhanced(supabase, 'ERROR', errorMsg, { 
          status: response.status, 
          statusText: response.statusText,
          responseText: responseText.substring(0, 500),
          webhookDuration,
          executionId: payload.anti_duplicate_metadata?.execution_id,
          webhookType
        }, requestId);
      }
      
      // Mark as failed in tracker
      globalExecutionTracker.set(executionKey, {
        timestamp: now,
        requestId,
        status: 'failed',
        payload: payload,
        executionId: payload.anti_duplicate_metadata?.execution_id || requestId,
        webhookType
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Enhanced webhook failed', 
          status: response.status,
          statusText: response.statusText,
          requestId,
          executionId: payload.anti_duplicate_metadata?.execution_id,
          responseText: responseText.substring(0, 200),
          webhookType
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark as completed with enhanced tracking
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'completed',
      payload: payload,
      executionId: payload.anti_duplicate_metadata?.execution_id || requestId,
      webhookType
    });

    const totalDuration = Date.now() - requestStartTime;
    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'SUCCESS - Enhanced webhook sent successfully', { 
        webhookType, 
        webhookDuration,
        totalDuration,
        executionKey,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        responsePreview: responseText.substring(0, 100),
        isJobAnalysis,
        isCoverLetter
      }, requestId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enhanced webhook sent successfully', 
        type: webhookType,
        requestId,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        duration: totalDuration,
        fingerprint,
        isJobAnalysis,
        isCoverLetter
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    if (supabase) {
      await logExecutionEnhanced(supabase, 'ERROR', 'FATAL ERROR in enhanced function', { 
        error: error.message, 
        stack: error.stack,
        totalDuration,
        fingerprint
      }, requestId);
    }
    
    // Clean up on error
    if (fingerprint) {
      const executionKey = `${fingerprint}-${payload?.webhook_type || payload?.event_type || 'unknown'}`;
      globalExecutionTracker.delete(executionKey);
      activeExecutions.delete(executionKey);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        requestId,
        duration: totalDuration,
        fingerprint
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } finally {
    // Always clean up abort controller
    if (fingerprint) {
      const executionKey = `${fingerprint}-${payload?.webhook_type || payload?.event_type || 'unknown'}`;
      activeExecutions.delete(executionKey);
    }
  }
});
