-- Update all existing users to have show_job_alerts_onboarding_popup as FALSE
UPDATE public.user_profile 
SET show_job_alerts_onboarding_popup = FALSE 
WHERE show_job_alerts_onboarding_popup = TRUE;

-- Change the default value for new users to FALSE
ALTER TABLE public.user_profile 
ALTER COLUMN show_job_alerts_onboarding_popup SET DEFAULT FALSE;