
-- Drop existing policies and recreate them with better error handling
DROP POLICY IF EXISTS "Users can insert their own interview prep records" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can view their own interview prep records" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can update their own interview prep records" ON public.interview_prep;

-- Ensure RLS is enabled
ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

-- Create a more robust INSERT policy that handles the user_profile relationship properly
CREATE POLICY "Users can insert their own interview prep records" ON public.interview_prep
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
    );

-- Create SELECT policy
CREATE POLICY "Users can view their own interview prep records" ON public.interview_prep
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
    );

-- Create UPDATE policy for N8N webhook updates
CREATE POLICY "Users can update their own interview prep records" ON public.interview_prep
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
    ) WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
        )
    );

-- Grant necessary permissions to ensure the policies work
GRANT SELECT, INSERT, UPDATE ON public.interview_prep TO authenticated;
GRANT SELECT ON public.user_profile TO authenticated;
GRANT SELECT ON public.users TO authenticated;
