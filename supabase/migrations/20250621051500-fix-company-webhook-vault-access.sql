
-- Fix the company role analysis webhook trigger to properly access vault secrets
-- Drop existing trigger and function to recreate with proper vault access
DROP TRIGGER IF EXISTS trigger_company_role_analysis_webhook ON public.company_role_analyses;
DROP FUNCTION IF EXISTS public.handle_company_role_analysis_webhook();

-- Enable HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Create the updated webhook trigger function with proper vault secret access
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
    secret_record RECORD;
BEGIN
    -- Only trigger on INSERT operations
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    RAISE LOG '[COMPANY_WEBHOOK] Starting webhook trigger for company analysis ID: %', NEW.id;
    
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
    
    RAISE LOG '[COMPANY_WEBHOOK] Generated fingerprint: % for company analysis: %', fingerprint, NEW.id;
    
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
        RAISE LOG '[COMPANY_WEBHOOK] ERROR: No user data found for user_profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    IF user_profile_data.id IS NULL THEN
        RAISE LOG '[COMPANY_WEBHOOK] ERROR: No user profile data found for profile_id: %', NEW.user_id;
        RETURN NEW;
    END IF;
    
    RAISE LOG '[COMPANY_WEBHOOK] Found user data - User ID: %, Email: %, Profile ID: %', 
        user_data.id, user_data.email, user_profile_data.id;
    
    -- Get the N8N webhook URL from vault secrets with proper error handling
    BEGIN
        SELECT * INTO secret_record 
        FROM vault.decrypted_secrets 
        WHERE name = 'N8N_COMPANY_WEBHOOK_URL';
        
        IF secret_record.decrypted_secret IS NOT NULL AND secret_record.decrypted_secret != '' THEN
            n8n_webhook_url := secret_record.decrypted_secret;
            RAISE LOG '[COMPANY_WEBHOOK] Found N8N webhook URL for company analysis: % (length: %)', NEW.id, length(n8n_webhook_url);
        ELSE
            RAISE LOG '[COMPANY_WEBHOOK] ERROR: N8N_COMPANY_WEBHOOK_URL secret is empty for company analysis: %', NEW.id;
            RETURN NEW;
        END IF;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE LOG '[COMPANY_WEBHOOK] ERROR: N8N_COMPANY_WEBHOOK_URL secret not found for company analysis: %', NEW.id;
            RETURN NEW;
        WHEN OTHERS THEN
            RAISE LOG '[COMPANY_WEBHOOK] ERROR: Failed to access vault secrets for company analysis: %. Error: %', NEW.id, SQLERRM;
            RETURN NEW;
    END;
    
    -- Set the edge function URL
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build the complete payload
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
            'trigger_source', 'company_analysis_trigger_vault_fix',
            'submission_time', extract(epoch from now()),
            'trigger_operation', TG_OP
        )
    );
    
    RAISE LOG '[COMPANY_WEBHOOK] Calling edge function for company analysis: % with payload size: %', 
        NEW.id, length(payload::text);
    
    -- Make the HTTP POST request to the edge function with timeout and better error handling
    BEGIN
        SELECT * INTO http_response FROM net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
                'X-Fingerprint', fingerprint,
                'X-Source', 'company-analysis-trigger-vault-fix',
                'X-Webhook-Type', 'company_analysis'
            ),
            body := payload
        );
        
        -- Log the response for debugging
        RAISE LOG '[COMPANY_WEBHOOK] Edge function response - Status: %, Content: %', 
            http_response.status_code, LEFT(http_response.content, 500);
            
        IF http_response.status_code = 200 THEN
            RAISE LOG '[COMPANY_WEBHOOK] SUCCESS: Webhook triggered successfully for record: % with fingerprint: %', 
                NEW.id, fingerprint;
        ELSE
            RAISE LOG '[COMPANY_WEBHOOK] ERROR: Edge function failed for record: %. Status: %, Response: %', 
                NEW.id, http_response.status_code, http_response.content;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG '[COMPANY_WEBHOOK] HTTP ERROR: Failed to call edge function for record: %. Error: %', NEW.id, SQLERRM;
            RETURN NEW;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG '[COMPANY_WEBHOOK] GENERAL ERROR: Error in company role analysis webhook for record: %. Error: %', NEW.id, SQLERRM;
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
    RAISE LOG '[COMPANY_WEBHOOK] Migration completed successfully - trigger and function recreated with proper vault access';
END $$;
