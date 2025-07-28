-- Change user_location column default to NULL
ALTER TABLE public.user_profile 
ALTER COLUMN user_location SET DEFAULT NULL;

-- Update existing 'global' values to NULL so they can be detected on next button click
UPDATE public.user_profile 
SET user_location = NULL 
WHERE user_location = 'global';