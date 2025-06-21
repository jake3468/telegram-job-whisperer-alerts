
-- Fix the company role analysis webhook trigger to match working pattern
-- Drop existing trigger and function to recreate with simple approach
DROP TRIGGER IF EXISTS trigger_company_role_analysis_webhook ON public.company_role_analyses;
DROP FUNCTION IF EXISTS public.handle_company_role_analysis_webhook();

-- Enable HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Create the updated webhook trigger function following the working job analysis pattern
CREATE OR REPLACE FUNCTION public.handle_company_role_analysis_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_called TEXT;
    user_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Create fingerprint for company analysis record with CRA prefix
    fingerprint := 'CRA_' || encode(
        digest(
            NEW.id::TEXT || 
            COALESCE(NEW.user_id::TEXT, '') || 
            COALESCE(NEW.company_name, '') || 
            COALESCE(NEW.job_title, '') ||
            extract(epoch from NEW.created_at)::TEXT,
            'sha256'
        ),
        'hex'
    );
    
    -- Use atomic function to check and insert execution
    SELECT public.check_and_insert_execution(
        fingerprint,
        NEW.id,
        NULL,
        'company_role_analysis_created',
        5
    ) INTO webhook_called;
    
    IF webhook_called = 'DUPLICATE' THEN
        RAISE LOG 'Company role analysis webhook already called for record % with fingerprint %', NEW.id, fingerprint;
        RETURN NEW;
    END IF;
    
    -- Get user data from user_profile and users tables
    SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.created_at, up.bio, up.resume, up.bot_activated, up.chat_id
    INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for company role analysis
    payload := jsonb_build_object(
        'company_role_analysis', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'location', NEW.location,
            'job_title', NEW.job_title,
            'research_date', NEW.research_date,
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
            'bio', user_data.bio,
            'created_at', user_data.created_at
        ),
        'user_profile', jsonb_build_object(
            'id', NEW.user_id,
            'user_id', user_data.id,
            'bio', user_data.bio,
            'resume', user_data.resume,
            'bot_activated', user_data.bot_activated,
            'chat_id', user_data.chat_id,
            'created_at', user_data.created_at
        ),
        'event_type', 'company_role_analysis_created',
        'webhook_type', 'company_analysis',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'execution_id', webhook_called,
            'fingerprint', fingerprint,
            'trigger_source', 'company_analysis_trigger_v3_simple',
            'submission_time', extract(epoch from now())
        )
    );
    
    -- Make HTTP POST request using PERFORM (no response capture)
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Execution-ID', webhook_called,
            'X-Fingerprint', fingerprint,
            'X-Source', 'company-analysis-trigger-v3-simple',
            'X-Webhook-Type', 'company_analysis'
        ),
        body := payload
    );
    
    RAISE LOG 'Company role analysis webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in company role analysis webhook: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the company_role_analyses table
CREATE TRIGGER trigger_company_role_analysis_webhook
    AFTER INSERT ON public.company_role_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_role_analysis_webhook();

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

-- Log successful completion
DO $$
BEGIN
    RAISE LOG 'Company role analysis webhook migration completed successfully - using simple working pattern';
END $$;
