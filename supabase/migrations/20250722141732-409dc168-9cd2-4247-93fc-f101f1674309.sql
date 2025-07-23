
-- Fix job_alerts RLS policies to match the working user_profile pattern
-- Drop the problematic policies that use get_current_clerk_user_id_reliable()

DROP POLICY IF EXISTS "Users can view their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Service role can manage job alerts" ON public.job_alerts;

-- Create new policies that match the working user_profile pattern
-- These use the same authentication approach that works for user_profile table

CREATE POLICY "Users can view their own job alerts" ON public.job_alerts
    FOR SELECT USING (
        user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert their own job alerts" ON public.job_alerts
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own job alerts" ON public.job_alerts
    FOR UPDATE USING (
        user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'service_role'
    ) WITH CHECK (
        user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own job alerts" ON public.job_alerts
    FOR DELETE USING (
        user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
        OR auth.role() = 'service_role'
    );

-- Service role policy for system operations
CREATE POLICY "Service role can manage job alerts" ON public.job_alerts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
