
-- Drop existing policies for job_cover_letters table if they exist
DROP POLICY IF EXISTS "Users can view their own cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can create their own cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can update their own cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can delete their own cover letters" ON public.job_cover_letters;

-- Create completely permissive policies for job_cover_letters table
-- We'll handle security in the application layer since we're using Clerk auth
CREATE POLICY "Allow all select operations on cover letters" 
ON public.job_cover_letters 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert operations on cover letters" 
ON public.job_cover_letters 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update operations on cover letters" 
ON public.job_cover_letters 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete operations on cover letters" 
ON public.job_cover_letters 
FOR DELETE 
USING (true);
