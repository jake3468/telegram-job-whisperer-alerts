
-- Create trigger function to handle company-role analysis webhook
CREATE OR REPLACE FUNCTION public.handle_company_role_analysis_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    user_profile_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
    n8n_webhook_url TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Create fingerprint for company-role analysis record
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
    
    -- Get user data from users table (NEW.user_id is the profile ID)
    SELECT u.* INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    -- Get user profile data
    SELECT * INTO user_profile_data 
    FROM public.user_profile 
    WHERE id = NEW.user_id;
    
    -- Only proceed if we have both user and profile data
    IF user_data.id IS NULL OR user_profile_data.id IS NULL THEN
        RAISE LOG 'Missing user or profile data for company-role analysis %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Get the N8N webhook URL from secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_COMPANY_WEBHOOK_URL';
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for company-role analysis
    payload := jsonb_build_object(
        'company_role_analysis', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'location', NEW.location,
            'job_title', NEW.job_title,
            'analysis_result', NEW.analysis_result,
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
            'trigger_source', 'company_analysis_trigger_v1',
            'submission_time', extract(epoch from now())
        )
    );
    
    -- Make HTTP POST request to edge function
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Fingerprint', fingerprint,
            'X-Source', 'company-analysis-trigger-v1',
            'X-Webhook-Type', 'company_analysis'
        ),
        body := payload
    );
    
    RAISE LOG 'Company-role analysis webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in company-role analysis webhook: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on company_role_analyses table
CREATE TRIGGER trigger_company_role_analysis_webhook
    AFTER INSERT ON public.company_role_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_company_role_analysis_webhook();
