-- Update the default value of show_onboarding_popup column to FALSE
ALTER TABLE public.user_profile 
ALTER COLUMN show_onboarding_popup SET DEFAULT false;

-- Update all existing users to have show_onboarding_popup as FALSE
UPDATE public.user_profile 
SET show_onboarding_popup = false 
WHERE show_onboarding_popup = true;