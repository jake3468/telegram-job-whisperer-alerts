-- Remove the existing checklist columns
ALTER TABLE public.job_tracker DROP COLUMN IF EXISTS checklist_items;
ALTER TABLE public.job_tracker DROP COLUMN IF EXISTS checklist_progress;

-- Add the 5 new boolean columns for checklist items
ALTER TABLE public.job_tracker ADD COLUMN resume_updated boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_tracker ADD COLUMN job_role_analyzed boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_tracker ADD COLUMN company_researched boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_tracker ADD COLUMN cover_letter_prepared boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_tracker ADD COLUMN ready_to_apply boolean NOT NULL DEFAULT false;