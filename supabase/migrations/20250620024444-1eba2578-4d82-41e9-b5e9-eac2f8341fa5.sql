
-- First, let's check what RLS policies currently exist on job_alerts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'job_alerts';

-- Drop existing policies and create new ones that work with your current auth setup
DROP POLICY IF EXISTS "Users can view own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can create own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete own job alerts" ON public.job_alerts;

-- Create policies that work with the existing user_profile relationship
-- The job_alerts.user_id references user_profile.id, not users.id directly
CREATE POLICY "Users can view their job alerts via profile" 
ON public.job_alerts 
FOR SELECT 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can create their job alerts via profile" 
ON public.job_alerts 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can update their job alerts via profile" 
ON public.job_alerts 
FOR UPDATE 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can delete their job alerts via profile" 
ON public.job_alerts 
FOR DELETE 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

-- Ensure RLS is enabled
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
