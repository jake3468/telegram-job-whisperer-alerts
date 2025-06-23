
-- Add service role policies for N8N webhook access
-- These policies allow the service role to perform all operations on the specified tables

-- company_role_analyses table
CREATE POLICY "Service role can manage company_role_analyses" 
ON public.company_role_analyses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- credit_transactions table  
CREATE POLICY "Service role can manage credit_transactions" 
ON public.credit_transactions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- job_analyses table
CREATE POLICY "Service role can manage job_analyses" 
ON public.job_analyses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- interview_prep table
CREATE POLICY "Service role can manage interview_prep" 
ON public.interview_prep 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- job_cover_letters table
CREATE POLICY "Service role can manage job_cover_letters" 
ON public.job_cover_letters 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- job_linkedin table
CREATE POLICY "Service role can manage job_linkedin" 
ON public.job_linkedin 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- linkedin_post_images table
CREATE POLICY "Service role can manage linkedin_post_images" 
ON public.linkedin_post_images 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- user_credits table
CREATE POLICY "Service role can manage user_credits" 
ON public.user_credits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- user_profile table
CREATE POLICY "Service role can manage user_profile" 
ON public.user_profile 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
