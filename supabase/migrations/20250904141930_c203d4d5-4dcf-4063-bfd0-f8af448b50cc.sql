-- Set all NULL user_location values to 'global'
UPDATE public.user_profile 
SET user_location = 'global' 
WHERE user_location IS NULL;