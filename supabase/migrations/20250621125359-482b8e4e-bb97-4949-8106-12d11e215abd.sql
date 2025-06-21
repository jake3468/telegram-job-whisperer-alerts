
-- Fix the interview prep webhook function to handle HTTP response correctly
CREATE OR REPLACE FUNCTION public.handle_interview_prep_webhook()
RETURNS TRIGGER AS $$
DECLARE
    user_data RECORD;
    user_profile_data RECORD;
    payload JSONB;
    edge_function_url TEXT;
    fingerprint TEXT;
BEGIN
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    RAISE LOG 'Interview prep webhook trigger started for record ID: %', NEW.id;
    
    -- Create fingerprint for interview prep record
    fingerprint := 'IP_' || encode(
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
    
    -- Get user data (NEW.user_id is the profile ID)
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
    
    -- Set the edge function URL
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/webhook-router';
    
    -- Build the complete payload for interview prep
    payload := jsonb_build_object(
        'interview_prep', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'company_name', NEW.company_name,
            'job_title', NEW.job_title,
            'job_description', NEW.job_description,
            'interview_questions', NEW.interview_questions,
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
        'event_type', 'interview_prep_created',
        'webhook_type', 'interview_prep',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'interview_prep_trigger_v4',
            'submission_time', extract(epoch from now())
        )
    );
    
    RAISE LOG 'Calling edge function for interview prep: % with payload size: %', 
        NEW.id, length(payload::text);
    
    -- Make the HTTP POST request (simplified - no response handling)
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Fingerprint', fingerprint,
            'X-Source', 'interview-prep-trigger-v4',
            'X-Webhook-Type', 'interview_prep'
        ),
        body := payload
    );
    
    RAISE LOG 'Successfully triggered interview prep webhook for record: % with fingerprint: %', 
        NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in interview prep webhook for record: %. Error: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
