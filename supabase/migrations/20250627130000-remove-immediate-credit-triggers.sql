
-- Remove all database triggers that automatically deduct credits on insert
-- This ensures credits are only deducted when results are successfully displayed

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_deduct_credits_job_analysis ON public.job_analyses;
DROP TRIGGER IF EXISTS trigger_deduct_credits_company_analysis ON public.company_role_analyses;
DROP TRIGGER IF EXISTS trigger_deduct_credits_interview_prep ON public.interview_prep;
DROP TRIGGER IF EXISTS trigger_deduct_credits_cover_letter ON public.job_cover_letters;
DROP TRIGGER IF EXISTS trigger_deduct_credits_linkedin_post ON public.job_linkedin;
DROP TRIGGER IF EXISTS trigger_deduct_credits_linkedin_image ON public.linkedin_post_images;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.deduct_credits_for_job_analysis() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_company_role_analysis() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_interview_prep() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_cover_letter() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_linkedin_post() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_linkedin_image() CASCADE;

-- Keep only the job alert trigger which is working correctly
-- (Credits deducted when last_run is updated, meaning alerts were actually sent)
