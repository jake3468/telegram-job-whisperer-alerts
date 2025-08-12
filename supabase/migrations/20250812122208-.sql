-- Fix critical security issue: job_tracker table allowing public access to sensitive job application data
-- Remove any overly permissive policies that might expose user job applications

-- Remove the overly broad service role policy that uses true for all operations
DROP POLICY IF EXISTS "Service role can manage job_tracker" ON public.job_tracker;

-- The existing user-specific policies look secure and should remain:
-- "Users can create their own job tracker entries"
-- "Users can delete their own job tracker entries" 
-- "Users can update their own job tracker entries"
-- "Users can view their own job tracker entries"
-- All use proper user_id verification through get_current_user_id()

-- Add a more restrictive service role policy for system operations only
CREATE POLICY "Service role can manage job tracker for system operations" 
ON public.job_tracker 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Verify RLS is enabled on the table (should already be enabled)
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;

-- Add comment documenting the security fix
COMMENT ON TABLE public.job_tracker IS 'Job tracker data with RLS enforced - users can only access their own job application records';

-- Note: This ensures job application data including company names, job titles, 
-- application status, and personal comments remain private to each user