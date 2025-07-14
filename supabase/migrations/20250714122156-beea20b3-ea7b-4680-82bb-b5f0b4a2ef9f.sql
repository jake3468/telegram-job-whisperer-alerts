-- Add show_job_tracker_onboarding_popup column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN show_job_tracker_onboarding_popup BOOLEAN NOT NULL DEFAULT TRUE;