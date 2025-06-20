
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fingerprint, x-source, x-webhook-type',
}

interface CompanyRoleAnalysis {
  id: string;
  user_id: string;
  company_name: string;
  location: string;
  job_title: string;
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
    
    const fingerprint = req.headers.get('x-fingerprint') || 'unknown';
    const source = req.headers.get('x-source') || 'unknown';
    const webhookType = req.headers.get('x-webhook-type') || payload.webhook_type;
    
    console.log(`🔍 Headers - Fingerprint: ${fingerprint}, Source: ${source}, WebhookType: ${webhookType}`);

    let n8nWebhookUrl: string | null = null;

    // Get the appropriate N8N webhook URL based on the webhook type
    if (webhookType === 'company_analysis' || payload.company_role_analysis) {
      console.log('📋 Processing company role analysis webhook');
      const { data: secretData, error: secretError } = await supabaseClient
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'N8N_COMPANY_WEBHOOK_URL')
        .single();

      if (secretError) {
        console.error('❌ Error fetching N8N_COMPANY_WEBHOOK_URL:', secretError);
        return new Response(JSON.stringify({ error: 'Failed to fetch company webhook URL' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      n8nWebhookUrl = secretData?.decrypted_secret;
      console.log(`🔗 Found N8N Company Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);

    } else if (webhookType === 'job_guide' || payload.job_analysis) {
      console.log('📋 Processing job analysis webhook');
      const { data: secretData, error: secretError } = await supabaseClient
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'N8N_JG_WEBHOOK_URL')
        .single();

      if (secretError) {
        console.error('❌ Error fetching N8N_JG_WEBHOOK_URL:', secretError);
        return new Response(JSON.stringify({ error: 'Failed to fetch job guide webhook URL' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      n8nWebhookUrl = secretData?.decrypted_secret;
      console.log(`🔗 Found N8N Job Guide Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);

    } else if (webhookType === 'cover_letter' || payload.job_cover_letter) {
      console.log('📋 Processing cover letter webhook');
      const { data: secretData, error: secretError } = await supabaseClient
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'N8N_CL_WEBHOOK_URL')
        .single();

      if (secretError) {
        console.error('❌ Error fetching N8N_CL_WEBHOOK_URL:', secretError);
        return new Response(JSON.stringify({ error: 'Failed to fetch cover letter webhook URL' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      n8nWebhookUrl = secretData?.decrypted_secret;
      console.log(`🔗 Found N8N Cover Letter Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);

    } else if (webhookType === 'linkedin_post' || payload.job_linkedin) {
      console.log('📋 Processing LinkedIn post webhook');
      const { data: secretData, error: secretError } = await supabaseClient
        .from('vault.decrypted_secrets')
        .select('decrypted_secret')
        .eq('name', 'N8N_LINKEDIN_WEBHOOK_URL')
        .single();

      if (secretError) {
        console.error('❌ Error fetching N8N_LINKEDIN_WEBHOOK_URL:', secretError);
        return new Response(JSON.stringify({ error: 'Failed to fetch LinkedIn webhook URL' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      n8nWebhookUrl = secretData?.decrypted_secret;
      console.log(`🔗 Found N8N LinkedIn Webhook URL: ${n8nWebhookUrl ? 'Yes' : 'No'}`);
    }

    if (!n8nWebhookUrl) {
      console.error(`❌ No N8N webhook URL found for webhook type: ${webhookType}`);
      return new Response(JSON.stringify({ error: `No webhook URL configured for type: ${webhookType}` }), {
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
        processed_at: new Date().toISOString(),
        edge_function_version: 'v3.1'
      }
    };

    console.log(`🚀 Calling N8N webhook: ${n8nWebhookUrl}`);
    console.log(`📤 Payload size: ${JSON.stringify(n8nPayload).length} characters`);

    // Call the N8N webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'X-Webhook-Source': 'supabase-edge-function',
        'X-Fingerprint': fingerprint,
        'X-Source': source,
        'X-Webhook-Type': webhookType
      },
      body: JSON.stringify(n8nPayload)
    });

    const responseText = await n8nResponse.text();
    console.log(`📡 N8N Response Status: ${n8nResponse.status}`);
    console.log(`📡 N8N Response: ${responseText}`);

    if (!n8nResponse.ok) {
      console.error(`❌ N8N webhook failed with status ${n8nResponse.status}: ${responseText}`);
      return new Response(JSON.stringify({ 
        error: 'N8N webhook failed', 
        status: n8nResponse.status,
        response: responseText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Successfully processed ${webhookType} webhook for ${payload.event_type}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${webhookType} webhook processed successfully`,
      fingerprint,
      n8n_status: n8nResponse.status
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
