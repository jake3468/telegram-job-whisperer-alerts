-- Fix security issue: Remove overly permissive testing policy from job_analyses table
-- This policy currently allows anyone to read all job analysis data including 
-- user IDs, company names, job descriptions, and match scores
DROP POLICY IF EXISTS "Allow all for testing" ON public.job_analyses;

-- Also remove the overly permissive service role policy if it exists
DROP POLICY IF EXISTS "Service role can manage job_analyses" ON public.job_analyses;

-- The existing user-specific policies already provide proper access control:
-- "Users can manage their own job analyses" - uses clerk_id matching
-- "Users can view their own job analyses" - uses clerk_id matching  
-- "Users can insert their own job analyses" - uses clerk_id matching
-- "Users can update their own job analyses" - uses clerk_id matching
-- "Users can delete their own job analyses" - uses clerk_id matching

-- Add service role policy with proper security definer access for system operations only
CREATE POLICY "Service role can manage job_analyses for system operations" 
ON public.job_analyses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add a comment to document the security fix
COMMENT ON TABLE public.job_analyses IS 'Job analysis data with RLS enforced - users can only access their own job analyses';