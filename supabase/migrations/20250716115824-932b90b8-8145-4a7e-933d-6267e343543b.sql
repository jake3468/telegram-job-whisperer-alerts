-- Fix the categorize_and_cleanup_jobs function to preserve saved jobs
CREATE OR REPLACE FUNCTION public.categorize_and_cleanup_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete jobs older than 7 days ONLY if they are NOT saved by users
  DELETE FROM public.job_board 
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND (is_saved_by_user = false OR is_saved_by_user IS NULL);
  
  -- Update sections for remaining jobs based on creation time
  UPDATE public.job_board 
  SET section = CASE 
    WHEN created_at > NOW() - INTERVAL '23 hours' THEN 'posted_today'
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 'last_7_days'
    ELSE 'last_7_days'
  END
  WHERE section IS DISTINCT FROM (
    CASE 
      WHEN created_at > NOW() - INTERVAL '23 hours' THEN 'posted_today'
      WHEN created_at > NOW() - INTERVAL '7 days' THEN 'last_7_days'
      ELSE 'last_7_days'
    END
  );
  
  -- Log cleanup activity
  RAISE LOG 'Job board cleanup completed at %', NOW();
END;
$function$;

-- Schedule the cleanup to run every hour (instead of on every fetch)
SELECT cron.schedule(
    'job-board-cleanup',
    '0 * * * *', -- Every hour at minute 0
    $$SELECT public.categorize_and_cleanup_jobs();$$
);