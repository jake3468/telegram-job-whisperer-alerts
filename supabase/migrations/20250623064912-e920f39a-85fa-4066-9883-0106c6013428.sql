
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.debug_user_auth();

-- Now recreate it with the updated return type
CREATE OR REPLACE FUNCTION public.debug_user_auth()
RETURNS TABLE(
  clerk_id text,
  jwt_sub text,
  jwt_issuer text,
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
    auth.jwt() ->> 'iss' as jwt_issuer,
    current_setting('request.jwt.claims', true) as current_setting_claims,
    EXISTS(SELECT 1 FROM public.users WHERE clerk_id = public.get_current_clerk_user_id()) as user_exists,
    (SELECT id FROM public.users WHERE clerk_id = public.get_current_clerk_user_id() LIMIT 1) as user_id_found;
$$;

-- Ensure all tables have proper RLS policies that work with both environments
-- Update user_profile policies to be more robust
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

-- Ensure user_credits policies work with both environments
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

-- Ensure credit_transactions policies work properly
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Enable RLS on all relevant tables
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_linkedin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_role_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

-- Add some debugging info
CREATE OR REPLACE FUNCTION public.test_jwt_access()
RETURNS TABLE(
  test_result text,
  clerk_id text,
  issuer text,
  can_access_users boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    'JWT Test Result' as test_result,
    auth.jwt() ->> 'sub' as clerk_id,
    auth.jwt() ->> 'iss' as issuer,
    EXISTS(SELECT 1 FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub') as can_access_users;
$$;
