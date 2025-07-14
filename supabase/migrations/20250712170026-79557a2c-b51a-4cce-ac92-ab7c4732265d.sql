-- Add interview_call_received column to job_tracker table
ALTER TABLE public.job_tracker ADD COLUMN interview_call_received boolean NOT NULL DEFAULT false;