-- Fix security vulnerabilities in users table RLS policies
-- Remove conflicting policies and ensure users can only access their own data

-- Drop all existing policies to rebuild them securely
DROP POLICY IF EXISTS "Authenticated users can select their own record" ON public.users;
DROP POLICY IF EXISTS "Deny all public access to users" ON public.users;
DROP POLICY IF EXISTS "Service role can create users" ON public.users;
DROP POLICY IF EXISTS "Service role can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;

-- Create secure, non-conflicting policies

-- 1. Service role can manage all users (needed for user creation and system operations)
CREATE POLICY "Service role can manage all users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view their own record with strict validation
CREATE POLICY "Users can view only their own record"
ON public.users
FOR SELECT
TO authenticated
USING (
  clerk_id IS NOT NULL 
  AND clerk_id = get_current_clerk_user_id_reliable()
  AND auth.uid() IS NOT NULL
  AND LENGTH(clerk_id) > 0
);

-- 3. Authenticated users can only update their own record with strict validation
CREATE POLICY "Users can update only their own record"
ON public.users
FOR UPDATE
TO authenticated
USING (
  clerk_id IS NOT NULL 
  AND clerk_id = get_current_clerk_user_id_reliable()
  AND auth.uid() IS NOT NULL
  AND LENGTH(clerk_id) > 0
)
WITH CHECK (
  clerk_id IS NOT NULL 
  AND clerk_id = get_current_clerk_user_id_reliable()
  AND auth.uid() IS NOT NULL
  AND LENGTH(clerk_id) > 0
);

-- 4. Explicitly deny all access to anonymous users
CREATE POLICY "Deny all anonymous access to users"
ON public.users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. Deny INSERT and DELETE operations for regular authenticated users
-- Only service role should be able to create/delete users
CREATE POLICY "Deny user creation by authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny user deletion by authenticated users"
ON public.users
FOR DELETE
TO authenticated
USING (false);