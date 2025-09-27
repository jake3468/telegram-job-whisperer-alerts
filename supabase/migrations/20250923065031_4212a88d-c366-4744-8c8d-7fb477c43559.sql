-- Add design_for_resume column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN design_for_resume text DEFAULT NULL;