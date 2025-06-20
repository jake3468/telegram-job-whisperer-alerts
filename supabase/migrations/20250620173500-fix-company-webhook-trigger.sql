
-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_company_role_analysis_webhook ON public.company_role_analyses;
DROP FUNCTION IF EXISTS public.handle_company_role_analysis_webhook();

-- Create an improved trigger function that only fires when analysis results are populated
CREATE OR REPLACE FUNCTION public.handle_company_role_analysis_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    user_profile_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
    n8n_webhook_url TEXT;
    http_response RECORD;
BEGIN
    -- Only trigger on INSERT or UPDATE operations
    IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
        RETURN NEW;
    END IF;
    
    -- Only proceed if we have analysis results (at least one analysis field is populated)
    IF NEW.local_role_market_context IS NULL 
       AND NEW.role_security_score IS NULL 
       AND NEW.role_experience_score IS NULL 
       AND NEW.role_compensation_analysis IS NULL THEN
        RAISE LOG 'Company analysis webhook skipped - no analysis results yet for record: %', NEW.id;
        RETURN NEW;
    END IF;
    
    RAISE LOG 'Company role analysis webhook trigger started for record ID: % with analysis results', NEW.id;
    
    -- Create a unique fingerprint for this analysis
    fingerprint := 'CRA_' || encode(
        digest(
            NEW.id::TEXT || 
            COALESCE(NEW.user_id::TEXT, '') || 
            COALESCE(NEW.company_name, '') || 
            COALESCE(NEW.job_title, '') ||
            COALESCE(NEW.local_role_market_context, '') ||
            extract(epoch from COALESCE(NEW.updated_at, NEW.created_at))::TEXT,
            'sha256'
        ),
        'hex'
    );
    
    RAISE LOG 'Generated fingerprint: % for company analysis: %', fingerprint, NEW.id;
    
    -- Get user data (NEW.user_id is the profile ID, so we need to join)
    SELECT u.* INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    -- Get user profile data
    SELECT * INTO user_profile_data 
    FROM public.user_profile 
    WHERE id = NEW.user_id;
    
    -- Check if we have the required data
    IF user_data.id IS NULL THEN
        RAISE LOG 'No user data found for user_profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    IF user_profile_data.id IS NULL THEN
        RAISE LOG 'No user profile data found for profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    RAISE LOG 'Found user data - User ID: %, Email: %, Profile ID: %', 
        user_data.id, user_data.email, user_profile_data.id;
    
    -- Get the N8N webhook URL from vault secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_COMPANY_WEBHOOK_URL';
    
    IF n8n_webhook_url IS NULL OR n8n_webhook_url = '' THEN
        RAISE LOG 'N8N_COMPANY_WEBHOOK_URL secret not found or empty for company analysis: %', NEW.id;
        RETURN NEW;
    END IF;
    
    RAISE LOG 'Found N8N webhook URL for company analysis: %', NEW.id;
    
    -- Set the edge function URL
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build the complete payload matching the edge function expectations
    payload := jsonb_build_object(
        'company_role_analysis', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'location', NEW.location,
            'job_title', NEW.job_title,
            'local_role_market_context', NEW.local_role_market_context,
            'company_news_updates', NEW.company_news_updates,
            'role_security_score', NEW.role_security_score,
            'role_security_score_breakdown', NEW.role_security_score_breakdown,
            'role_security_outlook', NEW.role_security_outlook,
            'role_security_automation_risks', NEW.role_security_automation_risks,
            'role_security_departmental_trends', NEW.role_security_departmental_trends,
            'role_experience_score', NEW.role_experience_score,
            'role_experience_score_breakdown', NEW.role_experience_score_breakdown,
            'role_experience_specific_insights', NEW.role_experience_specific_insights,
            'role_compensation_analysis', NEW.role_compensation_analysis,
            'role_workplace_environment', NEW.role_workplace_environment,
            'career_development', NEW.career_development,
            'role_specific_considerations', NEW.role_specific_considerations,
            'interview_and_hiring_insights', NEW.interview_and_hiring_insights,
            'sources', NEW.sources,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at
        ),
        'user', jsonb_build_object(
            'id', user_data.id,
            'clerk_id', user_data.clerk_id,
            'email', user_data.email,
            'first_name', user_data.first_name,
            'last_name', user_data.last_name,
            'created_at', user_data.created_at
        ),
        'user_profile', jsonb_build_object(
            'id', user_profile_data.id,
            'user_id', user_profile_data.user_id,
            'bio', user_profile_data.bio,
            'resume', user_profile_data.resume,
            'bot_activated', user_profile_data.bot_activated,
            'chat_id', user_profile_data.chat_id,
            'created_at', user_profile_data.created_at
        ),
        'event_type', CASE 
            WHEN TG_OP = 'INSERT' THEN 'company_role_analysis_created'
            ELSE 'company_role_analysis_updated'
        END,
        'webhook_type', 'company_analysis',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'company_analysis_trigger_v4',
            'submission_time', extract(epoch from now()),
            'trigger_operation', TG_OP
        )
    );
    
    RAISE LOG 'Calling edge function for company analysis: % with payload size: %', 
        NEW.id, length(payload::text);
    
    -- Make the HTTP POST request to the edge function
    SELECT * INTO http_response FROM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Fingerprint', fingerprint,
            'X-Source', 'company-analysis-trigger-v4',
            'X-Webhook-Type', 'company_analysis'
        ),
        body := payload
    );
    
    -- Log the response
    IF http_response.status_code = 200 THEN
        RAISE LOG 'Successfully triggered company analysis webhook for record: % with fingerprint: %', 
            NEW.id, fingerprint;
    ELSE
        RAISE LOG 'Company analysis webhook failed for record: %. Status: %, Response: %', 
            NEW.id, http_response.status_code, http_response.content;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in company role analysis webhook for record: %. Error: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on both INSERT and UPDATE
CREATE TRIGGER trigger_company_role_analysis_webhook
    AFTER INSERT OR UPDATE ON public.company_role_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_role_analysis_webhook();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Verify trigger creation
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'company_role_analyses' 
AND trigger_schema = 'public';
