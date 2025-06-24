
-- Phase 1: Emergency RLS Policy Fixes (Critical - Deploy Immediately)
-- Adding comprehensive DROP statements for all existing policies

-- Fix user_profile table RLS policies
DROP POLICY IF EXISTS "Allow all select operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all insert operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all update operations" ON public.user_profile;
DROP POLICY IF EXISTS "Allow all delete operations" ON public.user_profile;

-- Create secure user_profile policies
CREATE POLICY "Users can view their own profile" ON public.user_profile
    FOR SELECT USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

CREATE POLICY "Users can insert their own profile" ON public.user_profile
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

CREATE POLICY "Users can update their own profile" ON public.user_profile
    FOR UPDATE USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

CREATE POLICY "Users can delete their own profile" ON public.user_profile
    FOR DELETE USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

-- Fix job_cover_letters table RLS policies
DROP POLICY IF EXISTS "Allow all select operations on cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Allow all insert operations on cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Allow all update operations on cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Allow all delete operations on cover letters" ON public.job_cover_letters;

-- Create secure job_cover_letters policies
CREATE POLICY "Users can view their own cover letters" ON public.job_cover_letters
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own cover letters" ON public.job_cover_letters
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own cover letters" ON public.job_cover_letters
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete their own cover letters" ON public.job_cover_letters
    FOR DELETE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

-- Fix job_linkedin table RLS policies
DROP POLICY IF EXISTS "Allow all select operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Allow all insert operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Allow all update operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Allow all delete operations on LinkedIn posts" ON public.job_linkedin;

-- Create secure job_linkedin policies
CREATE POLICY "Users can view their own LinkedIn posts" ON public.job_linkedin
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own LinkedIn posts" ON public.job_linkedin
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own LinkedIn posts" ON public.job_linkedin
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete their own LinkedIn posts" ON public.job_linkedin
    FOR DELETE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

-- Fix company_role_analyses table RLS policies
DROP POLICY IF EXISTS "Allow all select operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all insert operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all update operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all delete operations on company role analyses" ON public.company_role_analyses;

-- Create secure company_role_analyses policies
CREATE POLICY "Users can view their own company analyses" ON public.company_role_analyses
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own company analyses" ON public.company_role_analyses
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own company analyses" ON public.company_role_analyses
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete their own company analyses" ON public.company_role_analyses
    FOR DELETE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

-- Fix job_analyses table RLS policies - DROP existing ones first
DROP POLICY IF EXISTS "Users can view their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can insert their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can update their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can delete their own job analyses" ON public.job_analyses;

-- Create secure job_analyses policies
CREATE POLICY "Users can view their own job analyses" ON public.job_analyses
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own job analyses" ON public.job_analyses
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own job analyses" ON public.job_analyses
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete their own job analyses" ON public.job_analyses
    FOR DELETE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

-- Fix interview_prep table RLS policies
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.interview_prep;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.interview_prep;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.interview_prep;
DROP POLICY IF EXISTS "Enable webhook updates" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can view their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can insert their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can update their own interview prep" ON public.interview_prep;
DROP POLICY IF EXISTS "Service role can update interview prep" ON public.interview_prep;

-- Create secure interview_prep policies
CREATE POLICY "Users can view their own interview prep" ON public.interview_prep
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own interview prep" ON public.interview_prep
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own interview prep" ON public.interview_prep
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_clerk_user_id()
        )
    );

-- Create a separate service role policy for webhook updates
CREATE POLICY "Service role can update interview prep" ON public.interview_prep
    FOR UPDATE USING (auth.role() = 'service_role');

-- Fix user_credits table RLS policies
DROP POLICY IF EXISTS "Allow all select operations on credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Allow all insert operations on credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Allow all update operations on credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Allow all delete operations on credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- Create secure user_credits policies
CREATE POLICY "Users can view their own credits" ON public.user_credits
    FOR SELECT USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

CREATE POLICY "Users can insert their own credits" ON public.user_credits
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

CREATE POLICY "Users can update their own credits" ON public.user_credits
    FOR UPDATE USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );

-- Fix credit_transactions table RLS policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

-- Create secure credit_transactions policy
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
    FOR SELECT USING (
        user_id = (SELECT id FROM public.users WHERE clerk_id = public.get_clerk_user_id())
    );
