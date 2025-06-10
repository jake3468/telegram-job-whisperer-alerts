
-- Step 1: Create new job_cover_letters table
CREATE TABLE public.job_cover_letters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key constraint
ALTER TABLE public.job_cover_letters 
ADD CONSTRAINT job_cover_letters_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Step 3: Remove cover_letter column from job_analyses table
ALTER TABLE public.job_analyses DROP COLUMN IF EXISTS cover_letter;

-- Step 4: Create updated_at trigger for job_cover_letters
CREATE TRIGGER update_job_cover_letters_updated_at
    BEFORE UPDATE ON public.job_cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Create atomic function for cover letter executions
CREATE OR REPLACE FUNCTION public.check_and_insert_cover_letter_execution(
    p_fingerprint TEXT,
    p_record_id UUID,
    p_submission_id TEXT DEFAULT NULL,
    p_request_type TEXT DEFAULT 'cover_letter_created',
    p_check_minutes INTEGER DEFAULT 10
)
RETURNS TEXT AS $$
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
            RAISE LOG 'Error in check_and_insert_cover_letter_execution: %', SQLERRM;
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger function for cover letters
CREATE OR REPLACE FUNCTION public.handle_cover_letter_webhook_secure()
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
    
    -- Use atomic function to check and insert execution
    SELECT public.check_and_insert_cover_letter_execution(
        fingerprint,
        NEW.id,
        NULL,
        'cover_letter_created',
        5
    ) INTO webhook_called;
    
    IF webhook_called = 'DUPLICATE' THEN
        RAISE LOG 'Cover letter webhook already called for record % with fingerprint %', NEW.id, fingerprint;
        RETURN NEW;
    END IF;
    
    -- Get user data
    SELECT * INTO user_data 
    FROM public.users 
    WHERE id = NEW.user_id;
    
    edge_function_url := 'https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/job-analysis-webhook';
    
    -- Build payload for cover letter
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
            'bio', user_data.bio,
            'credits', user_data.credits,
            'activated', user_data.activated,
            'created_at', user_data.created_at
        ),
        'event_type', 'cover_letter_created',
        'webhook_type', 'cover_letter',
        'timestamp', now(),
        'anti_duplicate_metadata', jsonb_build_object(
            'execution_id', webhook_called,
            'fingerprint', fingerprint,
            'trigger_source', 'cover_letter_trigger_v1',
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
            'X-Source', 'cover-letter-trigger-v1',
            'X-Webhook-Type', 'cover_letter'
        ),
        body := payload
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for cover letters
CREATE TRIGGER trigger_cover_letter_webhook_secure
    AFTER INSERT ON public.job_cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cover_letter_webhook_secure();

-- Step 8: Update job_analyses trigger to use job guide webhook
CREATE OR REPLACE FUNCTION public.handle_job_analysis_webhook_secure()
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
    
    -- Get user data
    SELECT * INTO user_data 
    FROM public.users 
    WHERE id = NEW.user_id;
    
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
            'activated', user_data.activated,
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_cover_letters_user_id 
ON public.job_cover_letters(user_id);

CREATE INDEX IF NOT EXISTS idx_job_cover_letters_created_at 
ON public.job_cover_letters(created_at DESC);

-- Step 10: Update webhook execution monitoring to handle both types
CREATE OR REPLACE VIEW public.webhook_execution_monitoring AS
SELECT 
    request_type,
    fingerprint,
    COUNT(*) as execution_count,
    array_agg(executed_at ORDER BY executed_at) as execution_times,
    MAX(executed_at) - MIN(executed_at) as time_diff_between_first_last,
    array_agg(status ORDER BY executed_at) as statuses,
    array_agg(id ORDER BY executed_at) as execution_ids
FROM public.webhook_executions 
WHERE executed_at > NOW() - INTERVAL '2 hours'
GROUP BY request_type, fingerprint
HAVING COUNT(*) > 1
ORDER BY MAX(executed_at) DESC;
