
-- Fix the company role analysis webhook trigger with enhanced vault secret access
-- Drop existing trigger and function to recreate with proper permissions
DROP TRIGGER IF EXISTS trigger_company_role_analysis_webhook ON public.company_role_analyses;
DROP FUNCTION IF EXISTS public.handle_company_role_analysis_webhook();

-- Create the updated webhook trigger function with enhanced vault secret access
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
    -- Only trigger on INSERT operations
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    RAISE LOG '[COMPANY_WEBHOOK_V2] Starting webhook trigger for company analysis ID: %', NEW.id;
    
    -- Create a unique fingerprint for this analysis
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
    
    RAISE LOG '[COMPANY_WEBHOOK_V2] Generated fingerprint: % for company analysis: %', fingerprint, NEW.id;
    
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
        RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: No user data found for user_profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    IF user_profile_data.id IS NULL THEN
        RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: No user profile data found for profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    RAISE LOG '[COMPANY_WEBHOOK_V2] Found user data - User ID: %, Email: %, Profile ID: %', 
        user_data.id, user_data.email, user_profile_data.id;
    
    -- Try to get the N8N webhook URL from vault secrets with enhanced error handling
    BEGIN
        -- Use a more direct approach to access vault secrets
        SELECT decrypted_secret INTO n8n_webhook_url
        FROM vault.decrypted_secrets 
        WHERE name = 'N8N_COMPANY_WEBHOOK_URL'
        LIMIT 1;
        
        IF n8n_webhook_url IS NULL OR n8n_webhook_url = '' THEN
            RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: N8N_COMPANY_WEBHOOK_URL secret is null or empty for company analysis: %', NEW.id;
            -- Don't return, continue without the secret and let edge function handle it
            n8n_webhook_url := '';
        ELSE
            RAISE LOG '[COMPANY_WEBHOOK_V2] Successfully retrieved N8N webhook URL for company analysis: % (length: %)', NEW.id, length(n8n_webhook_url);
        END IF;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: N8N_COMPANY_WEBHOOK_URL secret not found for company analysis: %', NEW.id;
            n8n_webhook_url := '';
        WHEN OTHERS THEN
            RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: Failed to access vault secrets for company analysis: %. Error: %', NEW.id, SQLERRM;
            n8n_webhook_url := '';
    END;
    
    -- Set the edge function URL
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build the complete payload (include the webhook URL even if empty - let edge function handle it)
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
        'event_type', 'company_role_analysis_created',
        'webhook_type', 'company_analysis',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'company_analysis_trigger_v2_enhanced',
            'submission_time', extract(epoch from now()),
            'trigger_operation', TG_OP
        )
    );
    
    RAISE LOG '[COMPANY_WEBHOOK_V2] Calling edge function for company analysis: % with payload size: %', 
        NEW.id, length(payload::text);
    
    -- Make the HTTP POST request to the edge function
    BEGIN
        SELECT * INTO http_response FROM net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
                'X-Fingerprint', fingerprint,
                'X-Source', 'company-analysis-trigger-v2-enhanced',
                'X-Webhook-Type', 'company_analysis'
            ),
            body := payload
        );
        
        -- Log the response for debugging
        RAISE LOG '[COMPANY_WEBHOOK_V2] Edge function response - Status: %, Content: %', 
            http_response.status_code, LEFT(http_response.content, 500);
            
        IF http_response.status_code = 200 THEN
            RAISE LOG '[COMPANY_WEBHOOK_V2] SUCCESS: Webhook triggered successfully for record: % with fingerprint: %', 
                NEW.id, fingerprint;
        ELSE
            RAISE LOG '[COMPANY_WEBHOOK_V2] ERROR: Edge function failed for record: %. Status: %, Response: %', 
                NEW.id, http_response.status_code, http_response.content;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG '[COMPANY_WEBHOOK_V2] HTTP ERROR: Failed to call edge function for record: %. Error: %', NEW.id, SQLERRM;
            RETURN NEW;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG '[COMPANY_WEBHOOK_V2] GENERAL ERROR: Error in company role analysis webhook for record: %. Error: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the company_role_analyses table
CREATE TRIGGER trigger_company_role_analysis_webhook
    AFTER INSERT ON public.company_role_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_role_analysis_webhook();

-- Grant necessary permissions for vault access
GRANT USAGE ON SCHEMA vault TO postgres;
GRANT SELECT ON vault.decrypted_secrets TO postgres;

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
    RAISE LOG '[COMPANY_WEBHOOK_V2] Migration completed successfully - trigger and function recreated with enhanced vault access and permissions';
END $$;
