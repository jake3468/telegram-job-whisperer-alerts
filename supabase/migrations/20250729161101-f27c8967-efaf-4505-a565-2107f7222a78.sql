-- Create job_telegram_uk table
CREATE TABLE public.job_telegram_uk (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Create unique constraint to prevent exact duplicates
    CONSTRAINT unique_job_company_uk UNIQUE (job_title, company_name)
);

-- Enable Row Level Security
ALTER TABLE public.job_telegram_uk ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage job_telegram_uk" 
ON public.job_telegram_uk 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create cleanup function for entries older than 47 hours
CREATE OR REPLACE FUNCTION public.cleanup_old_job_telegram_uk_data()
RETURNS TABLE(deleted_jobs integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    deleted_jobs_count integer := 0;
BEGIN
    -- Delete old job telegram UK entries
    DELETE FROM public.job_telegram_uk 
    WHERE created_at < NOW() - INTERVAL '47 hours';
    
    GET DIAGNOSTICS deleted_jobs_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'Job telegram UK cleanup completed: % jobs deleted', 
        deleted_jobs_count;
    
    RETURN QUERY SELECT deleted_jobs_count;
END;
$function$