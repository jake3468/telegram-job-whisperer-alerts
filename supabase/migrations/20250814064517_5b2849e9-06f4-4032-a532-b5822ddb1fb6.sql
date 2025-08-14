-- Add profile setup completion tracking to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN profile_setup_completed boolean NOT NULL DEFAULT false;