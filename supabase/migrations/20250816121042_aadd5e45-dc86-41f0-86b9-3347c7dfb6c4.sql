-- Add country_name column to add_job_telegram table
ALTER TABLE public.add_job_telegram 
ADD COLUMN country_name text;