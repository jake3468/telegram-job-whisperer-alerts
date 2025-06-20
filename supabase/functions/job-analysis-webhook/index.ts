
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
}>();

// Execution tracking with abort controllers for cleanup
const activeExecutions = new Map<string, AbortController>();

// Enhanced execution windows and cleanup intervals
const EXECUTION_WINDOW = 900000; // 15 minutes for extra safety
const CLEANUP_INTERVAL = 1800000; // 30 minutes cleanup
const MAX_EXECUTION_TIME = 300000; // 5 minutes max execution time

// Fixed cryptographic fingerprint generation - handles UTF-8 properly
async function generateEnhancedFingerprint(payload: any): Promise<string> {
  const { job_analysis, job_cover_letter, job_linkedin, company_role_analysis, user, webhook_type, event_type, anti_duplicate_metadata } = payload;
  
  // Handle all payload types including the new company_role_analysis
  const analysisData = job_analysis || job_cover_letter || job_linkedin || company_role_analysis;
  
  const fingerprintData = {
    user_id: user?.id || user?.clerk_id || 'unknown',
    record_id: analysisData?.id || 'unknown',
    webhook_type: webhook_type || event_type || 'job_analysis_created',
    company_name: analysisData?.company_name || '',
    job_title: analysisData?.job_title || '',
    location: analysisData?.location || '',
    topic: analysisData?.topic || '',
    // Fixed: Use proper UTF-8 encoding instead of btoa
    job_description_hash: analysisData?.job_description ? 
      (await crypto.subtle.digest('SHA-256', new TextEncoder().encode(analysisData.job_description.substring(0, 500)))).toString() : 'no-desc',
    submission_hash: payload.submission_hash || '',
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
    await logExecutionEnhanced(supabase, 'INFO', 'FUNCTION START - Enhanced Job Analysis/LinkedIn/Company Webhook called', {
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      clientInfo: req.headers.get('x-client-info'),
      contentType: req.headers.get('content-type'),
      executionId: req.headers.get('x-execution-id'),
      fingerprint: req.headers.get('x-fingerprint')
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

    // Determine webhook type from payload - now includes company analysis
    const webhookType = payload.webhook_type || payload.event_type || 'job_analysis_created';
    const isJobGuide = webhookType === 'job_guide' || webhookType === 'job_analysis_created';
    const isCoverLetter = webhookType === 'cover_letter' || webhookType === 'cover_letter_created';
    const isLinkedInPost = webhookType === 'linkedin_post' || webhookType === 'linkedin_post_created';
    const isCompanyAnalysis = webhookType === 'company_analysis' || webhookType === 'company_role_analysis_created';

    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced payload received and parsed', { 
        payloadKeys: Object.keys(payload),
        recordId: payload.job_analysis?.id || payload.job_cover_letter?.id || payload.job_linkedin?.id || payload.company_role_analysis?.id,
        userId: payload.user?.id || payload.user?.clerk_id,
        webhookType,
        isJobGuide,
        isCoverLetter,
        isLinkedInPost,
        isCompanyAnalysis,
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
        isJobGuide,
        isCoverLetter,
        isLinkedInPost,
        isCompanyAnalysis,
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
          currentRequestId: requestId
        }, requestId);
      }
      
      if (timeDiff < EXECUTION_WINDOW) {
        if (supabase) {
          await logExecutionEnhanced(supabase, 'WARN', 'BLOCKING DUPLICATE - Within enhanced execution window', { 
            timeDiff,
            windowSize: EXECUTION_WINDOW
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
    
    // LAYER 2: Enhanced existing results check for all types including company analysis
    if (supabase && (payload.job_analysis?.id || payload.job_cover_letter?.id || payload.job_linkedin?.id || payload.company_role_analysis?.id)) {
      const recordId = payload.job_analysis?.id || payload.job_cover_letter?.id || payload.job_linkedin?.id || payload.company_role_analysis?.id;
      let tableName, resultField;
      
      if (isJobGuide) {
        tableName = 'job_analyses';
        resultField = 'job_match';
      } else if (isCoverLetter) {
        tableName = 'job_cover_letters';
        resultField = 'cover_letter';
      } else if (isLinkedInPost) {
        tableName = 'job_linkedin';
        resultField = 'linkedin_post';
      } else if (isCompanyAnalysis) {
        tableName = 'company_role_analyses';
        resultField = 'analysis_result';
      }
      
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced checking database for existing results', { 
        recordId,
        tableName,
        resultField,
        webhookType
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
            hasResult: !!existingRecord[resultField]
          }, requestId);
          
          // Record execution as completed (no webhook needed)
          globalExecutionTracker.set(executionKey, {
            timestamp: now,
            requestId,
            status: 'completed',
            payload: payload,
            executionId: payload.anti_duplicate_metadata?.execution_id || 'result-exists'
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Enhanced result already exists - skipped', 
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
        await logExecutionEnhanced(supabase, 'WARN', 'Error checking existing record', { error: resultCheckError }, requestId);
      }
    }
    
    // Record enhanced execution immediately with better tracking
    globalExecutionTracker.set(executionKey, {
      timestamp: now,
      requestId,
      status: 'processing',
      payload: payload,
      executionId: payload.anti_duplicate_metadata?.execution_id || requestId
    });

    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced execution registered as PROCESSING', { 
        executionKey,
        totalTrackedExecutions: globalExecutionTracker.size,
        activeExecutions: activeExecutions.size,
        executionId: payload.anti_duplicate_metadata?.execution_id
      }, requestId);
    }
    
    // Enhanced cleanup with better timing
    const cleanupStats = performEnhancedCleanup();
    if (supabase && (cleanupStats.cleanedExecutions > 0 || cleanupStats.cleanedAbortControllers > 0)) {
      await logExecutionEnhanced(supabase, 'INFO', 'Enhanced cleanup completed', cleanupStats, requestId);
    }
    
    // Determine webhook URL based on type - now includes company analysis
    let webhookUrl: string | undefined;
    let webhookEnvVar: string;
    
    if (isCoverLetter) {
      webhookEnvVar = 'N8N_CL_WEBHOOK_URL';
      webhookUrl = Deno.env.get(webhookEnvVar);
    } else if (isLinkedInPost) {
      webhookEnvVar = 'N8N_LINKEDIN_WEBHOOK_URL';
      webhookUrl = Deno.env.get(webhookEnvVar);
    } else if (isCompanyAnalysis) {
      webhookEnvVar = 'N8N_COMPANY_WEBHOOK_URL';
      webhookUrl = Deno.env.get(webhookEnvVar);
    } else if (isJobGuide) {
      webhookEnvVar = 'N8N_JG_WEBHOOK_URL';
      webhookUrl = Deno.env.get(webhookEnvVar);
    } else {
      // Default to job guide webhook for unknown types
      webhookEnvVar = 'N8N_JG_WEBHOOK_URL';
      webhookUrl = Deno.env.get(webhookEnvVar);
    }
    
    if (!webhookUrl) {
      const errorMsg = `Enhanced ${webhookEnvVar} secret not configured for type ${webhookType}`;
      if (supabase) {
        await logExecutionEnhanced(supabase, 'ERROR', errorMsg, { webhookType, isCoverLetter, isJobGuide, isLinkedInPost, isCompanyAnalysis }, requestId);
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
        source: 'supabase-edge-function-enhanced-v8',
        preventDuplicates: true,
        submissionId: payload.submission_id || payload.request_id,
        antiDuplicateMetadata: payload.anti_duplicate_metadata,
        enhancedDuplicatePrevention: true,
        executionWindow: EXECUTION_WINDOW,
        databaseExecutionId: payload.anti_duplicate_metadata?.execution_id,
        triggerSource: payload.anti_duplicate_metadata?.trigger_source,
        isCoverLetter,
        isJobGuide,
        isLinkedInPost,
        isCompanyAnalysis
      }
    };

    // Forward to appropriate N8N webhook with enhanced headers and timeout protection
    if (supabase) {
      await logExecutionEnhanced(supabase, 'INFO', 'Sending to enhanced N8N webhook', { 
        webhookType, 
        webhookUrl: webhookUrl.substring(0, 50) + '...',
        payloadSize: JSON.stringify(enhancedPayload).length,
        executionId: payload.anti_duplicate_metadata?.execution_id,
        isCoverLetter,
        isJobGuide,
        isLinkedInPost,
        isCompanyAnalysis,
        webhookEnvVar
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
        'X-Source': 'supabase-edge-function-enhanced-v8',
        'X-Database-Execution-ID': payload.anti_duplicate_metadata?.execution_id || '',
        'X-Trigger-Source': payload.anti_duplicate_metadata?.trigger_source || '',
        'X-Is-Cover-Letter': isCoverLetter.toString(),
        'X-Is-Job-Guide': isJobGuide.toString(),
        'X-Is-LinkedIn-Post': isLinkedInPost.toString(),
        'X-Is-Company-Analysis': isCompanyAnalysis.toString()
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

    if (!response.ok) {
      const errorMsg = `Enhanced N8N webhook failed (${webhookType})`;
      if (supabase) {
        await logExecutionEnhanced(supabase, 'ERROR', errorMsg, { 
          status: response.status, 
          statusText: response.statusText,
          responseText: responseText.substring(0, 500),
          webhookDuration,
          executionId: payload.anti_duplicate_metadata?.execution_id,
          webhookUrl: webhookUrl.substring(0, 50) + '...'
        }, requestId);
      }
      
      // Mark as failed in tracker
      globalExecutionTracker.set(executionKey, {
        timestamp: now,
        requestId,
        status: 'failed',
        payload: payload,
        executionId: payload.anti_duplicate_metadata?.execution_id || requestId
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
      executionId: payload.anti_duplicate_metadata?.execution_id || requestId
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
        isCoverLetter,
        isJobGuide,
        isLinkedInPost,
        isCompanyAnalysis,
        webhookUrl: webhookUrl.substring(0, 50) + '...'
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
        isCoverLetter,
        isJobGuide,
        isLinkedInPost,
        isCompanyAnalysis
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
