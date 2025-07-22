-- Fix job_alerts RLS policies to correctly handle user_profile.id relationship
-- The issue: job_alerts.user_id references user_profile.id, NOT users.id

-- Drop the incorrect policies
DROP POLICY IF EXISTS "Users can view their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete their own job alerts" ON public.job_alerts;

-- Create correct RLS policies that handle the proper relationship chain:
-- job_alerts.user_id → user_profile.id → user_profile.user_id → users.id → users.clerk_id

CREATE POLICY "Users can view their own job alerts" ON public.job_alerts
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can insert their own job alerts" ON public.job_alerts
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can update their own job alerts" ON public.job_alerts
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = get_current_clerk_user_id_reliable()
        )
    ) WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = get_current_clerk_user_id_reliable()
        )
    );

CREATE POLICY "Users can delete their own job alerts" ON public.job_alerts
    FOR DELETE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = get_current_clerk_user_id_reliable()
        )
    );

-- Keep the service role policy
-- CREATE POLICY "Service role can manage job alerts" ON public.job_alerts
--     FOR ALL USING (auth.role() = 'service_role')
--     WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;