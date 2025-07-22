
-- Phase 2: Fix RLS Policy Conflicts on job_alerts table
-- Remove all conflicting and duplicate policies, then create clean ones matching user_profile pattern

-- Drop all existing conflicting policies on job_alerts
DROP POLICY IF EXISTS "Allow all delete operations on job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Allow all insert operations on job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Allow all select operations on job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Allow all update operations on job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can manage their own job alerts" ON public.job_alerts;

-- Create clean, simplified RLS policies matching the proven user_profile pattern
-- Using get_current_clerk_user_id_reliable() for consistency

CREATE POLICY "Users can view their own job alerts" ON public.job_alerts
    FOR SELECT USING (
        user_id IN (
            SELECT u.id FROM public.users u
            WHERE u.clerk_id = public.get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can insert their own job alerts" ON public.job_alerts
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT u.id FROM public.users u
            WHERE u.clerk_id = public.get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can update their own job alerts" ON public.job_alerts
    FOR UPDATE USING (
        user_id IN (
            SELECT u.id FROM public.users u
            WHERE u.clerk_id = public.get_current_clerk_user_id_reliable()
        )
    ) WITH CHECK (
        user_id IN (
            SELECT u.id FROM public.users u
            WHERE u.clerk_id = public.get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can delete their own job alerts" ON public.job_alerts
    FOR DELETE USING (
        user_id IN (
            SELECT u.id FROM public.users u
            WHERE u.clerk_id = public.get_current_clerk_user_id_reliable()
        )
    );

-- Service role policy for system operations
CREATE POLICY "Service role can manage job alerts" ON public.job_alerts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
