-- Fix security issue: Remove overly permissive users table policy
-- This policy currently allows anyone to view all user records including emails and names
DROP POLICY IF EXISTS "Allow viewing users" ON public.users;

-- The existing "Users can view their own user record" policy already provides 
-- the correct access control with expression: (clerk_id = get_current_clerk_user_id())
-- This ensures users can only see their own data, not other users' personal information

-- Add a comment to document the security fix
COMMENT ON TABLE public.users IS 'User records with RLS enforced - users can only view their own records';