
-- Fix user INSERT access for company_role_analyses
-- The issue is likely that users can't insert their own records

-- First ensure the service role policy remains intact
-- Then fix the user INSERT policy to be more permissive for initial creation

-- Drop the current user policy that might be too restrictive
DROP POLICY IF EXISTS "Authenticated users can manage their own analyses" ON public.company_role_analyses;

-- Create separate policies for better control
-- Allow users to view their own analyses
CREATE POLICY "Users can view own company analyses" 
ON public.company_role_analyses 
FOR SELECT 
TO authenticated
USING (
    user_id IN (
        SELECT up.id FROM public.user_profile up
        JOIN public.users u ON u.id = up.user_id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- Allow users to insert new analyses (more permissive for creation)
CREATE POLICY "Users can create company analyses" 
ON public.company_role_analyses 
FOR INSERT 
TO authenticated
WITH CHECK (
    -- Allow insert if the user_id matches a valid user profile
    EXISTS (
        SELECT 1 FROM public.user_profile up
        JOIN public.users u ON u.id = up.user_id
        WHERE up.id = user_id 
        AND u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- Allow users to update their own analyses (for when N8N updates come back)
CREATE POLICY "Users can update own company analyses" 
ON public.company_role_analyses 
FOR UPDATE 
TO authenticated
USING (
    user_id IN (
        SELECT up.id FROM public.user_profile up
        JOIN public.users u ON u.id = up.user_id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- Ensure service role policy is still there (should still exist from previous migration)
-- If not, recreate it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'company_role_analyses' 
        AND policyname = 'Service role bypass RLS'
    ) THEN
        CREATE POLICY "Service role bypass RLS" 
        ON public.company_role_analyses 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
