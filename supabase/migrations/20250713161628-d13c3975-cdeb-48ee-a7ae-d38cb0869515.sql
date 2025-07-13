-- Add section column to job_board table
ALTER TABLE public.job_board 
ADD COLUMN section TEXT DEFAULT 'last_7_days';

-- Create function to categorize jobs and cleanup old ones
CREATE OR REPLACE FUNCTION public.categorize_and_cleanup_jobs()
RETURNS void AS $$
BEGIN
  -- Delete jobs older than 7 days
  DELETE FROM public.job_board 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Update sections for remaining jobs
  UPDATE public.job_board 
  SET section = CASE 
    WHEN created_at > NOW() - INTERVAL '23 hours' THEN 'posted_today'
    WHEN created_at > NOW() - INTERVAL '7 days' THEN 'last_7_days'
    ELSE 'last_7_days'
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically categorize new jobs
CREATE OR REPLACE FUNCTION public.auto_categorize_job()
RETURNS TRIGGER AS $$
BEGIN
  NEW.section = CASE 
    WHEN NEW.created_at > NOW() - INTERVAL '23 hours' THEN 'posted_today'
    WHEN NEW.created_at > NOW() - INTERVAL '7 days' THEN 'last_7_days'
    ELSE 'last_7_days'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_categorize_job_trigger
  BEFORE INSERT OR UPDATE ON public.job_board
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_categorize_job();

-- Run initial categorization
SELECT public.categorize_and_cleanup_jobs();