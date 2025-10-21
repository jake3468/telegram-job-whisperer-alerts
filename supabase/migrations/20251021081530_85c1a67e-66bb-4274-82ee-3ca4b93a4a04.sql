-- Add addj_chat_id column to add_job_telegram table
ALTER TABLE public.add_job_telegram 
ADD COLUMN addj_chat_id TEXT DEFAULT NULL;