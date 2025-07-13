-- Drop existing trigger and function with CASCADE
DROP FUNCTION IF EXISTS public.check_job_alert_limit() CASCADE;

-- Create updated function with 3 alert limit
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

-- Create the trigger again
CREATE TRIGGER check_job_alert_limit_trigger
BEFORE INSERT ON public.job_alerts
FOR EACH ROW
EXECUTE FUNCTION public.check_job_alert_limit();

-- Add country_name column to job_alerts table
ALTER TABLE public.job_alerts ADD COLUMN country_name text;

-- Update existing country codes to lowercase and populate country_name
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

-- Handle job_type enum conversion
-- First convert column to text
ALTER TABLE public.job_alerts ALTER COLUMN job_type TYPE text;

-- Update values to new enum values
UPDATE public.job_alerts 
SET job_type = 'full-time';

-- Create new enum type
CREATE TYPE public.job_type_new AS ENUM ('full-time', 'part-time', 'contract', 'intern');

-- Convert column to new enum type
ALTER TABLE public.job_alerts ALTER COLUMN job_type TYPE public.job_type_new USING job_type::public.job_type_new;

-- Drop old enum and rename new one
DROP TYPE IF EXISTS public.job_type;
ALTER TYPE public.job_type_new RENAME TO job_type;