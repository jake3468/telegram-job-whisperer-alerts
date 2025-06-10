
-- Create trigger function to handle job analysis webhook calls
CREATE OR REPLACE FUNCTION public.handle_job_analysis_webhook_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    
    -- Get user data from user_profile and users tables
    SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.credits, u.created_at, up.bio
    INTO user_data 
    FROM public.users u
    JOIN public.user_profile up ON u.id = up.user_id
    WHERE up.id = NEW.user_id;
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for job analysis
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
            'credits', user_data.credits,
            'created_at', user_data.created_at
        ),
        'event_type', 'job_analysis_created',
        'webhook_type', 'job_guide',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'execution_id', webhook_called,
            'fingerprint', fingerprint,
            'trigger_source', 'job_guide_trigger_v1',
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
            'X-Source', 'job-guide-trigger-v1',
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
$function$;

-- Create the trigger that calls the webhook function
DROP TRIGGER IF EXISTS job_analysis_webhook_trigger ON public.job_analyses;
CREATE TRIGGER job_analysis_webhook_trigger
    AFTER INSERT ON public.job_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_job_analysis_webhook_secure();

-- Create the check_and_insert_execution function if it doesn't exist
CREATE OR REPLACE FUNCTION public.check_and_insert_execution(
    p_fingerprint text,
    p_record_id uuid,
    p_submission_id text DEFAULT NULL::text,
    p_request_type text DEFAULT 'job_analysis_created'::text,
    p_check_minutes integer DEFAULT 10
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    existing_id UUID;
    new_id UUID;
BEGIN
    BEGIN
        -- Check for existing execution within time window
        SELECT id INTO existing_id
        FROM public.webhook_executions
        WHERE fingerprint = p_fingerprint
        AND executed_at > NOW() - (p_check_minutes || ' minutes')::INTERVAL
        AND status IN ('processing', 'completed')
        AND request_type = p_request_type
        LIMIT 1;
        
        IF existing_id IS NOT NULL THEN
            RETURN 'DUPLICATE';
        END IF;
        
        -- Insert new execution record
        INSERT INTO public.webhook_executions (
            fingerprint,
            record_id,
            submission_id,
            request_type,
            status,
            executed_at
        ) VALUES (
            p_fingerprint,
            p_record_id,
            p_submission_id,
            p_request_type,
            'processing',
            NOW()
        ) RETURNING id INTO new_id;
        
        RETURN new_id::TEXT;
        
    EXCEPTION
        WHEN unique_violation THEN
            RETURN 'DUPLICATE';
        WHEN OTHERS THEN
            RAISE LOG 'Error in check_and_insert_execution: %', SQLERRM;
            RAISE;
    END;
END;
$function$;
