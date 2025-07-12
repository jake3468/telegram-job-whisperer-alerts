-- Add new interview checklist columns to job_tracker table
ALTER TABLE public.job_tracker ADD COLUMN interview_prep_guide_received boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_tracker ADD COLUMN ai_mock_interview_attempted boolean NOT NULL DEFAULT false;