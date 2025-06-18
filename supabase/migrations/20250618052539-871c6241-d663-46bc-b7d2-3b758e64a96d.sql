
-- First, let's add a variation_number column to the linkedin_post_images table
-- to better track which variation each image belongs to
ALTER TABLE public.linkedin_post_images 
ADD COLUMN variation_number integer;

-- Update the handle_linkedin_webhook function to prevent duplicate triggers
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
    webhook_called TEXT;
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
    
    -- Use atomic function to check and insert execution (prevent duplicates)
    SELECT public.check_and_insert_execution(
        fingerprint,
        NEW.id,
        NULL,
        'linkedin_post_created',
        5
    ) INTO webhook_called;
    
    IF webhook_called = 'DUPLICATE' THEN
        RAISE LOG 'LinkedIn post webhook already called for record % with fingerprint %', NEW.id, fingerprint;
        RETURN NEW;
    END IF;
    
    -- Get basic user data from users table (via user_profile)
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
    
    -- Build payload with job_linkedin data including all new columns and basic user info
    payload := jsonb_build_object(
        'job_linkedin', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'topic', NEW.topic,
            'opinion', NEW.opinion,
            'personal_story', NEW.personal_story,
            'audience', NEW.audience,
            'tone', NEW.tone,
            'post_heading_1', NEW.post_heading_1,
            'post_content_1', NEW.post_content_1,
            'post_heading_2', NEW.post_heading_2,
            'post_content_2', NEW.post_content_2,
            'post_heading_3', NEW.post_heading_3,
            'post_content_3', NEW.post_content_3,
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
            'execution_id', webhook_called,
            'fingerprint', fingerprint,
            'trigger_source', 'linkedin_post_trigger_v4',
            'submission_time', extract(epoch from now())
        )
    );
    
    -- Make HTTP POST request to edge function
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Execution-ID', webhook_called,
            'X-Fingerprint', fingerprint,
            'X-Source', 'linkedin-post-trigger-v4',
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
