
-- Fix RLS policies to ensure users can access their own data
-- The issue is likely with the get_clerk_user_id() function or JWT token handling

-- First, let's create a more robust function to get the current user
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$$;

-- Temporarily make the policies more permissive while we debug
-- This allows authenticated users to see their data based on the user relationship

-- Fix user_profile policies - use direct user_id match with users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;

CREATE POLICY "Users can view their own profile" ON public.user_profile
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own profile" ON public.user_profile
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own profile" ON public.user_profile
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete their own profile" ON public.user_profile
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Fix user_credits policies
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

CREATE POLICY "Users can view their own credits" ON public.user_credits
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own credits" ON public.user_credits
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own credits" ON public.user_credits
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Fix credit_transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Add debugging function to help troubleshoot authentication issues
CREATE OR REPLACE FUNCTION public.debug_user_auth()
RETURNS TABLE(
  clerk_id text,
  jwt_sub text,
  current_setting_claims text,
  user_exists boolean,
  user_id_found uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    public.get_current_clerk_user_id() as clerk_id,
    auth.jwt() ->> 'sub' as jwt_sub,
    current_setting('request.jwt.claims', true) as current_setting_claims,
    EXISTS(SELECT 1 FROM public.users WHERE clerk_id = public.get_current_clerk_user_id()) as user_exists,
    (SELECT id FROM public.users WHERE clerk_id = public.get_current_clerk_user_id() LIMIT 1) as user_id_found;
$$;
