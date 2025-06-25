
-- Remove the problematic CHECK constraint approach and use only the trigger
-- Create a function to check alert count before insert
CREATE OR REPLACE FUNCTION check_job_alert_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.job_alerts WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 job alerts allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the limit
DROP TRIGGER IF EXISTS enforce_job_alert_limit ON public.job_alerts;
CREATE TRIGGER enforce_job_alert_limit
  BEFORE INSERT ON public.job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION check_job_alert_limit();
