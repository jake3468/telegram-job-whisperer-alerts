
-- Phase 1: Critical RLS Policy Fixes (Revised)
-- Add missing RLS policies and fix overly permissive ones, handling existing policies

-- 1. Enable RLS on tables that don't have it (only if not already enabled)
ALTER TABLE public.company_role_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Fix company_role_analyses policies (drop and recreate to ensure consistency)
DROP POLICY IF EXISTS "Users can view their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can insert their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can update their own company analyses" ON public.company_role_analyses;

CREATE POLICY "Users can view their own company analyses" ON public.company_role_analyses
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own company analyses" ON public.company_role_analyses
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can update their own company analyses" ON public.company_role_analyses
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- 3. Add missing RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;

CREATE POLICY "Users can view their own user record" ON public.users
    FOR SELECT USING (clerk_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can update their own user record" ON public.users
    FOR UPDATE USING (clerk_id = public.get_current_clerk_user_id());

-- 4. Fix credit_transactions RLS
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- 5. Fix linkedin_post_images policies
DROP POLICY IF EXISTS "Users can view their own linkedin images" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert their own linkedin images" ON public.linkedin_post_images;

CREATE POLICY "Users can view their own linkedin images" ON public.linkedin_post_images
    FOR SELECT USING (
        post_id IN (
            SELECT jl.id FROM public.job_linkedin jl
            JOIN public.user_profile up ON jl.user_id = up.id
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

CREATE POLICY "Users can insert their own linkedin images" ON public.linkedin_post_images
    FOR INSERT WITH CHECK (
        post_id IN (
            SELECT jl.id FROM public.job_linkedin jl
            JOIN public.user_profile up ON jl.user_id = up.id
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- 6. Fix job_alerts policies
DROP POLICY IF EXISTS "Users can manage their own job alerts" ON public.job_alerts;

CREATE POLICY "Users can manage their own job alerts" ON public.job_alerts
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    ) WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = public.get_current_clerk_user_id()
        )
    );

-- 7. Fix job_analyses policies
DROP POLICY IF EXISTS "Users can manage their own job analyses" ON public.job_analyses;

CREATE POLICY "Users can manage their own job analyses" ON public.job_analyses
    FOR ALL USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    ) WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- 8. Secure system tables (execution_logs and webhook_executions)
DROP POLICY IF EXISTS "Allow all operations on execution logs" ON public.execution_logs;
DROP POLICY IF EXISTS "Allow all operations on webhook executions" ON public.webhook_executions;
DROP POLICY IF EXISTS "Service role only access to execution logs" ON public.execution_logs;
DROP POLICY IF EXISTS "Service role only access to webhook executions" ON public.webhook_executions;

CREATE POLICY "Service role only access to execution logs" ON public.execution_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access to webhook executions" ON public.webhook_executions
    FOR ALL USING (auth.role() = 'service_role');
