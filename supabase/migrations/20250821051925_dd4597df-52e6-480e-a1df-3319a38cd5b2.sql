-- Allow NULL values for user_id in add_job_chat_history_new table
ALTER TABLE public.add_job_chat_history_new 
ALTER COLUMN user_id DROP NOT NULL;