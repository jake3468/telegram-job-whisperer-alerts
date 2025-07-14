-- Update the categorize_and_cleanup_jobs function to handle proper time-based categorization
CREATE OR REPLACE FUNCTION public.categorize_and_cleanup_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete jobs older than 7 days
  DELETE FROM public.job_board 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
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
END;
$function$;