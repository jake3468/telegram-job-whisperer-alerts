
-- Phase 1: Remove existing database triggers that automatically deduct credits
DROP TRIGGER IF EXISTS deduct_credits_on_job_analysis_insert ON public.job_analyses;
DROP TRIGGER IF EXISTS deduct_credits_on_company_role_analysis_insert ON public.company_role_analyses;
DROP TRIGGER IF EXISTS deduct_credits_on_interview_prep_insert ON public.interview_prep;
DROP TRIGGER IF EXISTS deduct_credits_on_cover_letter_insert ON public.job_cover_letters;
DROP TRIGGER IF EXISTS deduct_credits_on_linkedin_post_insert ON public.job_linkedin;
DROP TRIGGER IF EXISTS deduct_credits_on_linkedin_image_insert ON public.linkedin_post_images;
DROP TRIGGER IF EXISTS deduct_credits_on_job_alert_run ON public.job_alerts;

-- Additional trigger names that might exist
DROP TRIGGER IF EXISTS trigger_deduct_credits_job_analysis ON public.job_analyses;
DROP TRIGGER IF EXISTS trigger_deduct_credits_company_analysis ON public.company_role_analyses;
DROP TRIGGER IF EXISTS trigger_deduct_credits_interview_prep ON public.interview_prep;
DROP TRIGGER IF EXISTS trigger_deduct_credits_cover_letter ON public.job_cover_letters;
DROP TRIGGER IF EXISTS trigger_deduct_credits_linkedin_post ON public.job_linkedin;
DROP TRIGGER IF EXISTS trigger_deduct_credits_linkedin_image ON public.linkedin_post_images;
DROP TRIGGER IF EXISTS trigger_deduct_credits_job_alert ON public.job_alerts;

-- Drop the trigger functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.deduct_credits_for_job_analysis() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_company_role_analysis() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_interview_prep() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_cover_letter() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_linkedin_post() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_linkedin_image() CASCADE;
DROP FUNCTION IF EXISTS public.deduct_credits_for_job_alert_run() CASCADE;
