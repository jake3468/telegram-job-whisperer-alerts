-- Fix critical security issue: interview_prep table is publicly readable
-- Remove dangerous policies that allow public access to sensitive interview data

-- Remove the overly permissive testing policy that exposes all user interview data
DROP POLICY IF EXISTS "Allow all for testing" ON public.interview_prep;

-- Remove the overly permissive service role policy 
DROP POLICY IF EXISTS "Service role can manage interview_prep" ON public.interview_prep;

-- Clean up duplicate/outdated policies - keep only the most secure ones
DROP POLICY IF EXISTS "Users can create their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can insert their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can update their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can view their own interview prep" ON public.interview_prep;

-- Keep the most secure and current policies that use the reliable clerk_id matching:
-- "Users can insert their own interview prep records"
-- "Users can update their own interview prep records" 
-- "Users can view their own interview prep records"

-- Add a proper service role policy for system operations only
CREATE POLICY "Service role can manage interview prep for system operations" 
ON public.interview_prep 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add a delete policy for users to manage their own records
CREATE POLICY "Users can delete their own interview prep records" 
ON public.interview_prep 
FOR DELETE 
TO authenticated 
USING (user_id IN ( 
  SELECT up.id
  FROM (user_profile up
    JOIN users u ON ((u.id = up.user_id)))
  WHERE (u.clerk_id = COALESCE(((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text), (auth.jwt() ->> 'sub'::text)))
));

-- Add comment documenting the security fix
COMMENT ON TABLE public.interview_prep IS 'Interview preparation data with RLS enforced - users can only access their own interview prep records';

-- Note: This removes public access while preserving user-specific access through clerk_id verification