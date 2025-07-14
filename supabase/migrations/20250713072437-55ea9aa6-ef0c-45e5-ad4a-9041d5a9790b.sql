-- Update job alerts limit trigger from 5 to 3
DROP TRIGGER IF EXISTS check_job_alert_limit_trigger ON public.job_alerts;
DROP FUNCTION IF EXISTS public.check_job_alert_limit();

CREATE OR REPLACE FUNCTION public.check_job_alert_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.job_alerts WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 job alerts allowed per user';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER check_job_alert_limit_trigger
BEFORE INSERT ON public.job_alerts
FOR EACH ROW
EXECUTE FUNCTION public.check_job_alert_limit();

-- Add country_name column to job_alerts table
ALTER TABLE public.job_alerts ADD COLUMN country_name text;

-- Update existing country codes to lowercase and populate country_name
-- This is a basic mapping - in practice you'd have a more comprehensive mapping
UPDATE public.job_alerts 
SET 
  country = LOWER(country),
  country_name = CASE 
    WHEN UPPER(country) = 'US' THEN 'United States'
    WHEN UPPER(country) = 'IN' THEN 'India'
    WHEN UPPER(country) = 'GB' THEN 'United Kingdom'
    WHEN UPPER(country) = 'CA' THEN 'Canada'
    WHEN UPPER(country) = 'AU' THEN 'Australia'
    WHEN UPPER(country) = 'DE' THEN 'Germany'
    WHEN UPPER(country) = 'FR' THEN 'France'
    WHEN UPPER(country) = 'JP' THEN 'Japan'
    WHEN UPPER(country) = 'BR' THEN 'Brazil'
    WHEN UPPER(country) = 'MX' THEN 'Mexico'
    ELSE 'Unknown Country'
  END;

-- Remove max_alerts_per_day column
ALTER TABLE public.job_alerts DROP COLUMN IF EXISTS max_alerts_per_day;

-- Update job_type enum to new employment types
-- First, we need to handle existing data
UPDATE public.job_alerts 
SET job_type = CASE 
  WHEN job_type = 'Remote' THEN 'full-time'
  WHEN job_type = 'On-site' THEN 'full-time'
  WHEN job_type = 'Hybrid' THEN 'full-time'
  ELSE 'full-time'
END;

-- Drop the old enum and create new one
ALTER TABLE public.job_alerts ALTER COLUMN job_type TYPE text;
DROP TYPE IF EXISTS public.job_type;
CREATE TYPE public.job_type AS ENUM ('full-time', 'part-time', 'contract', 'intern');
ALTER TABLE public.job_alerts ALTER COLUMN job_type TYPE public.job_type USING job_type::public.job_type;