-- Add job_alert_reminder column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN job_alert_reminder TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL;