-- Fix job_reference_id to not auto-generate for all jobs
-- It should only be populated when job is added to tracker

-- First, remove the default value from job_reference_id column
ALTER TABLE public.job_board 
ALTER COLUMN job_reference_id DROP DEFAULT;

-- Update existing jobs that have job_reference_id but are not in job_tracker
-- to set job_reference_id to NULL
UPDATE public.job_board 
SET job_reference_id = NULL 
WHERE job_reference_id IS NOT NULL 
AND id NOT IN (
  SELECT DISTINCT jb.id 
  FROM public.job_board jb 
  INNER JOIN public.job_tracker jt ON jb.job_reference_id = jt.job_reference_id
  WHERE jb.job_reference_id IS NOT NULL
);