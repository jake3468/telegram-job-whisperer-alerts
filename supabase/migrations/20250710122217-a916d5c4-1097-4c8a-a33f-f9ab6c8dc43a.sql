-- Create trigger function for grace interview requests webhook
CREATE OR REPLACE FUNCTION public.handle_grace_interview_request_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    
    RAISE LOG 'Grace interview request webhook trigger started for record ID: %', NEW.id;
    
    -- Create fingerprint for grace interview request record
    fingerprint := 'GIR_' || encode(
        digest(
            NEW.id::TEXT || 
            COALESCE(NEW.user_id::TEXT, '') || 
            COALESCE(NEW.phone_number, '') || 
            COALESCE(NEW.company_name, '') ||
            extract(epoch from NEW.created_at)::TEXT,
            'sha256'
        ),
        'hex'
    );
    
    -- Get user data if user_id is provided
    IF NEW.user_id IS NOT NULL THEN
        SELECT u.* INTO user_data 
        FROM public.users u
        JOIN public.user_profile up ON u.id = up.user_id
        WHERE up.id = NEW.user_id;
        
        -- Get user profile data
        SELECT * INTO user_profile_data 
        FROM public.user_profile 
        WHERE id = NEW.user_id;
        
        RAISE LOG 'Found user data - User ID: %, Email: %, Profile ID: %', 
            user_data.id, user_data.email, user_profile_data.id;
    END IF;
    
    -- Set the edge function URL
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/webhook-router';
    
    -- Build the complete payload for grace interview request
    payload := jsonb_build_object(
        'grace_interview_request', jsonb_build_object(
            'id', NEW.id,
            'user_id', NEW.user_id,
            'phone_number', NEW.phone_number,
            'company_name', NEW.company_name,
            'job_title', NEW.job_title,
            'job_description', NEW.job_description,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'processed_at', NEW.processed_at
        ),
        'user', CASE 
            WHEN user_data.id IS NOT NULL THEN jsonb_build_object(
                'id', user_data.id,
                'clerk_id', user_data.clerk_id,
                'email', user_data.email,
                'first_name', user_data.first_name,
                'last_name', user_data.last_name,
                'created_at', user_data.created_at
            )
            ELSE NULL
        END,
        'user_profile', CASE 
            WHEN user_profile_data.id IS NOT NULL THEN jsonb_build_object(
                'id', user_profile_data.id,
                'user_id', user_profile_data.user_id,
                'bio', user_profile_data.bio,
                'resume', user_profile_data.resume,
                'bot_activated', user_profile_data.bot_activated,
                'chat_id', user_profile_data.chat_id,
                'created_at', user_profile_data.created_at
            )
            ELSE NULL
        END,
        'event_type', 'grace_interview_request_created',
        'webhook_type', 'phone_interview',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'fingerprint', fingerprint,
            'trigger_source', 'grace_interview_trigger_v1',
            'submission_time', extract(epoch from now())
        )
    );
    
    RAISE LOG 'Calling edge function for grace interview request: % with payload size: %', 
        NEW.id, length(payload::text);
    
    -- Make the HTTP POST request (simplified - no response handling)
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk',
            'X-Fingerprint', fingerprint,
            'X-Source', 'grace-interview-trigger-v1',
            'X-Webhook-Type', 'phone_interview'
        ),
        body := payload
    );
    
    RAISE LOG 'Successfully triggered grace interview request webhook for record: % with fingerprint: %', 
        NEW.id, fingerprint;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in grace interview request webhook for record: %. Error: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER grace_interview_request_webhook_trigger
    AFTER INSERT ON public.grace_interview_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_grace_interview_request_webhook();