
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own interview prep records" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can view their own interview prep records" ON public.interview_prep;
DROP POLICY IF EXISTS "Users can update their own interview prep records" ON public.interview_prep;

-- Ensure RLS is enabled
ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

-- Create simple, direct policies that match the working pattern from other tables
-- INSERT policy: Allow users to insert records where user_id matches their profile
CREATE POLICY "Enable insert for users based on user_id" ON public.interview_prep
    FOR INSERT WITH CHECK (
        user_id = (
            SELECT up.id 
            FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
            LIMIT 1
        )
    );

-- SELECT policy: Allow users to view their own records
CREATE POLICY "Enable read access for users based on user_id" ON public.interview_prep
    FOR SELECT USING (
        user_id = (
            SELECT up.id 
            FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
            LIMIT 1
        )
    );

-- UPDATE policy: Allow users to update their own records (needed for webhook)
CREATE POLICY "Enable update for users based on user_id" ON public.interview_prep
    FOR UPDATE USING (
        user_id = (
            SELECT up.id 
            FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
            LIMIT 1
        )
    ) WITH CHECK (
        user_id = (
            SELECT up.id 
            FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = COALESCE(
                current_setting('request.jwt.claims', true)::json ->> 'sub',
                auth.jwt() ->> 'sub'
            )
            LIMIT 1
        )
    );

-- Ensure proper grants are in place
GRANT SELECT, INSERT, UPDATE ON public.interview_prep TO authenticated;
GRANT SELECT ON public.user_profile TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- Add a policy that allows the service role to update (for webhooks)
CREATE POLICY "Enable webhook updates" ON public.interview_prep
    FOR UPDATE USING (true)
    WITH CHECK (true);
