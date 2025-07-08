-- Fix RLS policies for job_tracker table to work with user_profile.id references

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can create their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can update their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can delete their own job tracker entries" ON public.job_tracker;

-- Create corrected RLS policies that properly reference user_profile
CREATE POLICY "Users can view their own job tracker entries" 
  ON public.job_tracker 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can create their own job tracker entries" 
  ON public.job_tracker 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can update their own job tracker entries" 
  ON public.job_tracker 
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can delete their own job tracker entries" 
  ON public.job_tracker 
  FOR DELETE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));