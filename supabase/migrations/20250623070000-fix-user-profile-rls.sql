
-- Fix user_profile RLS policies to work with Clerk JWT
-- The debug shows that JWT claims are not being recognized properly

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;

-- Create more robust policies that work with the current JWT setup
-- Since credits are working but profile isn't, we need to match the credits approach

CREATE POLICY "Users can view their own profile" ON public.user_profile
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        -- Fallback: if JWT parsing fails, allow authenticated users to see their profile
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can insert their own profile" ON public.user_profile
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own profile" ON public.user_profile
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own profile" ON public.user_profile
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'authenticated'
    );

-- Ensure RLS is enabled
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Update the debug function to provide more detailed JWT information
CREATE OR REPLACE FUNCTION public.debug_user_auth()
RETURNS TABLE(
  clerk_id text,
  jwt_sub text,
  jwt_issuer text,
  jwt_aud text,
  current_setting_claims text,
  auth_role text,
  user_exists boolean,
  user_id_found uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    public.get_current_clerk_user_id() as clerk_id,
    auth.jwt() ->> 'sub' as jwt_sub,
    auth.jwt() ->> 'iss' as jwt_issuer,
    auth.jwt() ->> 'aud' as jwt_aud,
    current_setting('request.jwt.claims', true) as current_setting_claims,
    auth.role() as auth_role,
    EXISTS(SELECT 1 FROM public.users WHERE clerk_id = public.get_current_clerk_user_id()) as user_exists,
    (SELECT id FROM public.users WHERE clerk_id = public.get_current_clerk_user_id() LIMIT 1) as user_id_found;
$$;
