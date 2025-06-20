
-- Temporarily create permissive policies for job_alerts table like the other tables
-- This matches the pattern used in user_profile and job_cover_letters tables

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view their job alerts via profile" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can create their job alerts via profile" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update their job alerts via profile" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete their job alerts via profile" ON public.job_alerts;

-- Create permissive policies that allow all operations (like user_profile table)
-- We'll handle security in the application layer since we're using Clerk auth
CREATE POLICY "Allow all select operations on job alerts" 
ON public.job_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert operations on job alerts" 
ON public.job_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update operations on job alerts" 
ON public.job_alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete operations on job alerts" 
ON public.job_alerts 
FOR DELETE 
USING (true);

-- Ensure RLS is still enabled
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
