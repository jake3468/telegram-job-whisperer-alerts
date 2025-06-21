
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fingerprint, x-source, x-webhook-type, x-execution-id',
}

interface CompanyRoleAnalysis {
  id: string;
  user_id: string;
  company_name: string;
  location: string;
  job_title: string;
  research_date?: string;
  local_role_market_context?: string;
  company_news_updates?: string[];
  role_security_score?: number;
  role_security_score_breakdown?: string[];
  role_security_outlook?: string;
  role_security_automation_risks?: string;
  role_security_departmental_trends?: string;
  role_experience_score?: number;
  role_experience_score_breakdown?: string[];
  role_experience_specific_insights?: string;
  role_compensation_analysis?: any;
  role_workplace_environment?: any;
  career_development?: any;
  role_specific_considerations?: any;
  interview_and_hiring_insights?: any;
  sources?: any;
  created_at: string;
  updated_at: string;
}

interface JobAnalysis {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  job_match?: string;
  match_score?: string;
  created_at: string;
  updated_at: string;
}

interface JobCoverLetter {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter?: string;
  created_at: string;
  updated_at: string;
}

interface LinkedInPost {
  id: string;
  user_id: string;
  topic: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
  created_at: string;
  updated_at: string;
}

interface InterviewPrep {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  interview_questions?: any;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  resume?: string;
  bot_activated?: boolean;
  chat_id?: string;
  created_at: string;
}

interface WebhookPayload {
  company_role_analysis?: CompanyRoleAnalysis;
  job_analysis?: JobAnalysis;
  job_cover_letter?: JobCoverLetter;
  job_linkedin?: LinkedInPost;
  interview_prep?: InterviewPrep;
  user: User;
  user_profile?: UserProfile;
  event_type: string;
  webhook_type: string;
  timestamp: string;
  n8n_webhook_url?: string;
  anti_duplicate_metadata: any;
}

serve(async (req) => {
  console.log(`🚀 Edge function called: ${req.method} ${req.url}`);
  console.log(`📋 Request headers:`, Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: WebhookPayload = await req.json()
    console.log(`📦 Received payload for event: ${payload.event_type}, webhook_type: ${payload.webhook_type}`);
    console.log(`📦 Full payload structure:`, JSON.stringify(payload, null, 2));
    
    const fingerprint = req.headers.get('x-fingerprint') || 'unknown';
    const source = req.headers.get('x-source') || 'unknown';
    const webhookType = req.headers.get('x-webhook-type') || payload.webhook_type;
    const executionId = req.headers.get('x-execution-id') || 'unknown';
    
    console.log(`🔍 Headers - Fingerprint: ${fingerprint}, Source: ${source}, WebhookType: ${webhookType}, ExecutionId: ${executionId}`);

    let n8nWebhookUrl: string | null = null;

    // Get the appropriate N8N webhook URL based on the webhook type using environment variables
    if (webhookType === 'company_analysis' || payload.company_role_analysis) {
      console.log('📋 Processing company role analysis webhook');
      
      n8nWebhookUrl = Deno.env.get('N8N_COMPANY_WEBHOOK_URL');
      console.log(`🔗 N8N Company Webhook URL from env: ${n8nWebhookUrl ? 'Found' : 'Not found'}`);
      
      if (!n8nWebhookUrl) {
        console.error('❌ N8N_COMPANY_WEBHOOK_URL environment variable not set');
        return new Response(JSON.stringify({ 
          error: 'N8N_COMPANY_WEBHOOK_URL not configured in environment', 
          execution_id: executionId,
          fingerprint: fingerprint
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } else if (webhookType === 'job_guide' || payload.job_analysis) {
      console.log('📋 Processing job analysis webhook');
      n8nWebhookUrl = Deno.env.get('N8N_JG_WEBHOOK_URL');
      console.log(`🔗 Found N8N Job Guide Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);

    } else if (webhookType === 'cover_letter' || payload.job_cover_letter) {
      console.log('📋 Processing cover letter webhook');
      n8nWebhookUrl = Deno.env.get('N8N_CL_WEBHOOK_URL');
      console.log(`🔗 Found N8N Cover Letter Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);

    } else if (webhookType === 'linkedin_post' || payload.job_linkedin) {
      console.log('📋 Processing LinkedIn post webhook');
      n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_WEBHOOK_URL');
      console.log(`🔗 Found N8N LinkedIn Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);
      
    } else if (webhookType === 'interview_prep' || payload.interview_prep) {
      console.log('📋 Processing interview prep webhook');
      n8nWebhookUrl = Deno.env.get('N8N_INTERVIEW_WEBHOOK_URL');
      console.log(`🔗 Found N8N Interview Prep Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);
    }

    if (!n8nWebhookUrl) {
      console.error(`❌ No N8N webhook URL found for webhook type: ${webhookType}`);
      return new Response(JSON.stringify({ 
        error: `No webhook URL configured for type: ${webhookType}`,
        execution_id: executionId,
        fingerprint: fingerprint
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare the payload for N8N
    const n8nPayload = {
      ...payload,
      webhook_metadata: {
        fingerprint,
        source,
        webhook_type: webhookType,
        execution_id: executionId,
        processed_at: new Date().toISOString(),
        edge_function_version: 'v7.1'
      }
    };

    console.log(`🚀 Calling N8N webhook: ${n8nWebhookUrl.substring(0, 50)}...`);
    console.log(`📤 Payload size: ${JSON.stringify(n8nPayload).length} characters`);
    console.log(`🔍 Execution ID: ${executionId}, Fingerprint: ${fingerprint}`);

    // Call the N8N webhook with enhanced error handling
    let n8nResponse: Response;
    let responseText: string;
    
    try {
      n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/7.1',
          'X-Webhook-Source': 'supabase-edge-function',
          'X-Fingerprint': fingerprint,
          'X-Source': source,
          'X-Webhook-Type': webhookType,
          'X-Execution-ID': executionId
        },
        body: JSON.stringify(n8nPayload)
      });

      responseText = await n8nResponse.text();
      console.log(`📡 N8N Response Status: ${n8nResponse.status}`);
      console.log(`📡 N8N Response Headers: ${JSON.stringify(Object.fromEntries(n8nResponse.headers.entries()))}`);
      console.log(`📡 N8N Response: ${responseText}`);

    } catch (fetchError) {
      console.error(`❌ N8N webhook fetch error:`, fetchError);
      return new Response(JSON.stringify({ 
        error: 'Failed to call N8N webhook', 
        details: fetchError.message,
        webhook_url: n8nWebhookUrl.substring(0, 50) + '...',
        execution_id: executionId,
        fingerprint: fingerprint
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!n8nResponse.ok) {
      console.error(`❌ N8N webhook failed with status ${n8nResponse.status}: ${responseText}`);
      return new Response(JSON.stringify({ 
        error: 'N8N webhook failed', 
        status: n8nResponse.status,
        response: responseText,
        webhook_url: n8nWebhookUrl.substring(0, 50) + '...',
        execution_id: executionId,
        fingerprint: fingerprint
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Successfully processed ${webhookType} webhook for ${payload.event_type}`);
    console.log(`🔍 Final execution details - ID: ${executionId}, Fingerprint: ${fingerprint}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${webhookType} webhook processed successfully`,
      fingerprint,
      execution_id: executionId,
      n8n_status: n8nResponse.status,
      n8n_response: responseText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
