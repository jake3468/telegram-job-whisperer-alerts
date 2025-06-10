
-- Add match_score column to job_analyses table to store percentage values
ALTER TABLE public.job_analyses 
ADD COLUMN match_score text;
