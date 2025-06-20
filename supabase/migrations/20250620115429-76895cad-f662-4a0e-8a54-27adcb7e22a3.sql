
-- Create function to cleanup old company role analysis data (60 days)
CREATE OR REPLACE FUNCTION cleanup_old_company_analysis_data()
RETURNS TABLE(deleted_analyses integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_analyses_count integer := 0;
BEGIN
    -- Delete old company role analyses
    DELETE FROM public.company_role_analyses 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    GET DIAGNOSTICS deleted_analyses_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'Company analysis cleanup completed: % analyses deleted', 
        deleted_analyses_count;
    
    RETURN QUERY SELECT deleted_analyses_count;
END;
$$;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_company_role_analyses_created_at ON public.company_role_analyses(created_at);

-- Schedule the cleanup to run daily at 3 AM
SELECT cron.schedule(
    'company-analysis-cleanup',
    '0 3 * * *', -- Daily at 3 AM
    $$SELECT public.cleanup_old_company_analysis_data();$$
);

-- Enable real-time updates for company_role_analyses table
ALTER TABLE public.company_role_analyses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_role_analyses;
