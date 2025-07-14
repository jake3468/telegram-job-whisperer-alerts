-- Add checklist functionality to job_tracker table
ALTER TABLE public.job_tracker 
ADD COLUMN checklist_progress integer NOT NULL DEFAULT 0,
ADD COLUMN checklist_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add constraints to ensure valid progress values
ALTER TABLE public.job_tracker 
ADD CONSTRAINT checklist_progress_range CHECK (checklist_progress >= 0 AND checklist_progress <= 5);