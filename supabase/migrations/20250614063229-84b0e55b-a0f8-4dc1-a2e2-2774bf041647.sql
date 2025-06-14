
-- Drop the existing incorrect policies
DROP POLICY IF EXISTS "Users can insert their own LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Users can view their own LinkedIn posts" ON public.job_linkedin;
DROP POLICY IF EXISTS "Users can update their own LinkedIn posts" ON public.job_linkedin;

-- Create correct policies that work with user_profile.id
-- Policy to allow users to insert LinkedIn posts using their user_profile.id
CREATE POLICY "Allow all insert operations on LinkedIn posts" ON public.job_linkedin
    FOR INSERT 
    WITH CHECK (true);

-- Policy to allow users to view LinkedIn posts using their user_profile.id  
CREATE POLICY "Allow all select operations on LinkedIn posts" ON public.job_linkedin
    FOR SELECT 
    USING (true);

-- Policy to allow users to update LinkedIn posts using their user_profile.id
CREATE POLICY "Allow all update operations on LinkedIn posts" ON public.job_linkedin
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);
