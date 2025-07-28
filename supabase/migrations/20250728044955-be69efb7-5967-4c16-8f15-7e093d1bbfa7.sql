-- Add user_location column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN user_location TEXT DEFAULT 'global';

-- Update existing users to have 'global' as their location
UPDATE public.user_profile 
SET user_location = 'global' 
WHERE user_location IS NULL;