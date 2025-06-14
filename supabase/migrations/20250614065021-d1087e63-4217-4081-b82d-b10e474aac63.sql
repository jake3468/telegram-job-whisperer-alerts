
-- Fix the SELECT policy for job_linkedin table to work with user_profile.id
DROP POLICY IF EXISTS "Allow all select operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Users can view their own LinkedIn posts" ON public.job_linkedin;

-- Create a proper select policy that works with user_profile.id
CREATE POLICY "Users can view their own LinkedIn posts" ON public.job_linkedin
    FOR SELECT 
    USING (user_id IN (
        SELECT up.id 
        FROM public.user_profile up 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Also ensure INSERT and UPDATE policies are consistent
DROP POLICY IF EXISTS "Allow all insert operations on LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Allow all update operations on LinkedIn posts" ON public.job_linkedin;

CREATE POLICY "Users can insert their own LinkedIn posts" ON public.job_linkedin
    FOR INSERT 
    WITH CHECK (user_id IN (
        SELECT up.id 
        FROM public.user_profile up 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can update their own LinkedIn posts" ON public.job_linkedin
    FOR UPDATE 
    USING (user_id IN (
        SELECT up.id 
        FROM public.user_profile up 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ))
    WITH CHECK (user_id IN (
        SELECT up.id 
        FROM public.user_profile up 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));
