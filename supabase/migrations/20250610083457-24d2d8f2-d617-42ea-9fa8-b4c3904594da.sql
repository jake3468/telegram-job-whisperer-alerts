
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_cover_letter_webhook ON public.job_cover_letters;
DROP FUNCTION IF EXISTS public.handle_cover_letter_webhook();

-- Create updated trigger function that properly handles user_profile data
CREATE OR REPLACE FUNCTION public.handle_cover_letter_webhook()
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
    
    -- Get user data from users table (note: NEW.user_id is actually the profile ID)
    SELECT u.* INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    -- Get user profile data
    SELECT * INTO user_profile_data 
    FROM public.user_profile 
    WHERE id = NEW.user_id;
    
    -- Get the N8N webhook URL from secrets
    SELECT decrypted_secret INTO n8n_webhook_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'N8N_CL_WEBHOOK_URL';
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for cover letter with both user and user_profile data
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
            'credits', user_data.credits,
            'created_at', user_data.created_at
        ),
        'user_profile', jsonb_build_object(
            'id', user_profile_data.id,
            'user_id', user_profile_data.user_id,
            'bio', user_profile_data.bio,
            'resume', user_profile_data.resume,
            'bot_activated', user_profile_data.bot_activated,
            'bot_id', user_profile_data.bot_id,
            'chat_id', user_profile_data.chat_id,
            'created_at', user_profile_data.created_at
        ),
        'event_type', 'cover_letter_created',
        'webhook_type', 'cover_letter',
        'timestamp', now(),
        'n8n_webhook_url', n8n_webhook_url,
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'cover_letter_trigger_v2',
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
            'X-Source', 'cover-letter-trigger-v2',
            'X-Webhook-Type', 'cover_letter'
        ),
        body := payload
    );
    
    RAISE LOG 'Cover letter webhook triggered for record % with fingerprint %', NEW.id, fingerprint;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on job_cover_letters table
CREATE TRIGGER trigger_cover_letter_webhook
    AFTER INSERT ON public.job_cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cover_letter_webhook();
