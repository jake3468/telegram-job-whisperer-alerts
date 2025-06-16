
-- Fix the cover letter webhook function
CREATE OR REPLACE FUNCTION public.handle_cover_letter_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
    n8n_webhook_url TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Create fingerprint for cover letter record
    fingerprint := 'CL_' || encode(
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
    
    -- Get basic user data from users table (via user_profile) - REMOVED credits column reference
    SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.created_at 
    INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    -- Get the N8N webhook URL from secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_CL_WEBHOOK_URL';
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload with ONLY job_cover_letters data and basic user info (without credits)
    payload := jsonb_build_object(
        'job_cover_letter', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'job_title', NEW.job_title,
            'job_description', NEW.job_description,
            'cover_letter', NEW.cover_letter,
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
        'event_type', 'cover_letter_created',
        'webhook_type', 'cover_letter',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'cover_letter_trigger_v6',
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
            'X-Source', 'cover-letter-trigger-v6',
            'X-Webhook-Type', 'cover_letter'
        ),
        body := payload
    );
    
    RAISE LOG 'Cover letter webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in cover letter webhook: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the job analysis webhook function
CREATE OR REPLACE FUNCTION public.handle_job_analysis_webhook_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    
    -- Create fingerprint for job analysis record with JG prefix
    fingerprint := 'JG_' || encode(
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
        'job_analysis_created',
        5
    ) INTO webhook_called;
    
    IF webhook_called = 'DUPLICATE' THEN
        RAISE LOG 'Job analysis webhook already called for record % with fingerprint %', NEW.id, fingerprint;
        RETURN NEW;
    END IF;
    
    -- Get user data from user_profile and users tables - REMOVED credits column reference
    SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.created_at, up.bio
    INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for job analysis (without credits)
    payload := jsonb_build_object(
        'job_analysis', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'job_title', NEW.job_title,
            'job_description', NEW.job_description,
            'job_match', NEW.job_match,
            'match_score', NEW.match_score,
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
        'event_type', 'job_analysis_created',
        'webhook_type', 'job_guide',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'execution_id', webhook_called,
            'fingerprint', fingerprint,
            'trigger_source', 'job_guide_trigger_v2',
            'submission_time', extract(epoch from now())
        )
    );
    
    -- Make HTTP POST request
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Execution-ID', webhook_called,
            'X-Fingerprint', fingerprint,
            'X-Source', 'job-guide-trigger-v2',
            'X-Webhook-Type', 'job_guide'
        ),
        body := payload
    );
    
    RAISE LOG 'Job analysis webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in job analysis webhook: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Fix the LinkedIn webhook function
CREATE OR REPLACE FUNCTION public.handle_linkedin_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
    n8n_webhook_url TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Create fingerprint for LinkedIn post record
    fingerprint := 'LI_' || encode(
        digest(
            NEW.id::TEXT || 
            COALESCE(NEW.user_id::TEXT, '') || 
            COALESCE(NEW.topic, '') || 
            extract(epoch from NEW.created_at)::TEXT,
            'sha256'
        ),
        'hex'
    );
    
    -- Get basic user data from users table (via user_profile) - REMOVED credits column reference
    SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.created_at 
    INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    -- Get the N8N webhook URL from secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_LINKEDIN_WEBHOOK_URL';
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload with job_linkedin data and basic user info (without credits)
    payload := jsonb_build_object(
        'job_linkedin', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'topic', NEW.topic,
            'opinion', NEW.opinion,
            'personal_story', NEW.personal_story,
            'audience', NEW.audience,
            'tone', NEW.tone,
            'linkedin_post', NEW.linkedin_post,
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
        'event_type', 'linkedin_post_created',
        'webhook_type', 'linkedin_post',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'linkedin_post_trigger_v2',
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
            'X-Source', 'linkedin-post-trigger-v2',
            'X-Webhook-Type', 'linkedin_post'
        ),
        body := payload
    );
    
    RAISE LOG 'LinkedIn post webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in LinkedIn post webhook: %', SQLERRM;
        RETURN NEW;
END;
$$;
