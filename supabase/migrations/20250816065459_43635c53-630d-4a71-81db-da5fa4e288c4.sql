-- Remove foreign key constraint from add_job_telegram.user_id column
ALTER TABLE public.add_job_telegram 
DROP CONSTRAINT IF EXISTS add_job_telegram_user_id_fkey;