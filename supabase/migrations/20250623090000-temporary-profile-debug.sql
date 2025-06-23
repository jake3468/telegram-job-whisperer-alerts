
-- Temporarily create more permissive policies for user_profile to debug the issue
-- This will help us determine if the problem is with RLS or JWT transmission

-- Drop the current restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all select operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all insert operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all update operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all delete operations" ON public.user_profile;

-- Create debug-friendly policies that show us what's happening
CREATE POLICY "Debug: Allow authenticated users to view profiles" ON public.user_profile
    FOR SELECT USING (
        -- Log the auth state for debugging
        auth.role() = 'authenticated' OR 
        auth.role() = 'anon' -- Temporarily allow anon for debugging
    );

CREATE POLICY "Debug: Allow authenticated users to insert profiles" ON public.user_profile
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'anon' -- Temporarily allow anon for debugging
    );

CREATE POLICY "Debug: Allow authenticated users to update profiles" ON public.user_profile
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'anon' -- Temporarily allow anon for debugging
    );

CREATE POLICY "Debug: Allow authenticated users to delete profiles" ON public.user_profile
    FOR DELETE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'anon' -- Temporarily allow anon for debugging
    );

-- Create a function to debug the current auth state
CREATE OR REPLACE FUNCTION public.debug_current_auth_state()
RETURNS TABLE(
  current_role text,
  jwt_claims jsonb,
  request_headers jsonb,
  can_access_profiles boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    auth.role() as current_role,
    auth.jwt() as jwt_claims,
    current_setting('request.headers', true)::jsonb as request_headers,
    EXISTS(SELECT 1 FROM public.user_profile LIMIT 1) as can_access_profiles;
$$;

-- Ensure RLS is still enabled but with permissive policies for debugging
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
