-- Add job_reference_id column to job_tracker table for better job tracking
ALTER TABLE public.job_tracker 
ADD COLUMN IF NOT EXISTS job_reference_id UUID;

-- Create index on job_reference_id for better performance in job_tracker
CREATE INDEX IF NOT EXISTS idx_job_tracker_job_reference_id ON public.job_tracker(job_reference_id);