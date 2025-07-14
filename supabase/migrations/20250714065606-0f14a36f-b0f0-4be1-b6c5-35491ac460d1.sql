-- Add show_job_alerts_onboarding_popup column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN show_job_alerts_onboarding_popup BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to show the popup by default
UPDATE public.user_profile 
SET show_job_alerts_onboarding_popup = true 
WHERE show_job_alerts_onboarding_popup IS NULL;