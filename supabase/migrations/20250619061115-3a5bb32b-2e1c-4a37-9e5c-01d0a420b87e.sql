
-- Add new columns to user_profile table for CV bot functionality
ALTER TABLE public.user_profile 
ADD COLUMN cv_chat_id text NULL,
ADD COLUMN cv_bot_activated boolean NOT NULL DEFAULT false;

-- Drop the user_resumes table as it's no longer needed
DROP TABLE IF EXISTS public.user_resumes;
