
-- Enable RLS on interview_prep table if not already enabled
ALTER TABLE public.interview_prep ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to insert their own interview prep records
CREATE POLICY "Users can insert their own interview prep records" ON public.interview_prep
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE up.id = interview_prep.user_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Create RLS policy to allow users to view their own interview prep records
CREATE POLICY "Users can view their own interview prep records" ON public.interview_prep
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE up.id = interview_prep.user_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Create RLS policy to allow users to update their own interview prep records (for when N8N updates the results)
CREATE POLICY "Users can update their own interview prep records" ON public.interview_prep
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE up.id = interview_prep.user_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE up.id = interview_prep.user_id
            AND u.clerk_id = auth.jwt() ->> 'sub'
        )
    );
