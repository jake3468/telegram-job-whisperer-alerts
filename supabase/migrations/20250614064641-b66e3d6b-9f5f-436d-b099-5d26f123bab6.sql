
-- First, let's check and fix the RLS policies for job_linkedin table
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow all delete operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Users can delete their own LinkedIn posts" ON public.job_linkedin;

-- Create a proper delete policy that works with user_profile.id
CREATE POLICY "Users can delete their own LinkedIn posts" ON public.job_linkedin
    FOR DELETE 
    USING (user_id IN (
        SELECT up.id 
        FROM public.user_profile up 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));
