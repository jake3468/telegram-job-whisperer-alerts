-- Add country_code column to job_board table
ALTER TABLE public.job_board 
ADD COLUMN country_code text;