
-- First, let's see what policies exist on the job_alerts table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'job_alerts';

-- Drop any existing policies on job_alerts to start fresh
DROP POLICY IF EXISTS "Users can view their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can create their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete their own job alerts" ON public.job_alerts;

-- Create new policies for job_alerts table
CREATE POLICY "Users can view own job alerts" 
ON public.job_alerts 
FOR SELECT 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can create own job alerts" 
ON public.job_alerts 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can update own job alerts" 
ON public.job_alerts 
FOR UPDATE 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));

CREATE POLICY "Users can delete own job alerts" 
ON public.job_alerts 
FOR DELETE 
USING (user_id IN (
  SELECT up.id FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  WHERE u.clerk_id = public.get_clerk_user_id()
));
