
-- Fix company_role_analyses RLS policies by dropping all existing ones first
-- This ensures we have a clean state before creating the correct policies

-- Drop ALL existing policies on company_role_analyses table
DROP POLICY IF EXISTS "Users can view their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can insert their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can update their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can delete their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Service role can manage company_role_analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all select operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all insert operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all update operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all delete operations on company role analyses" ON public.company_role_analyses;

-- Now create the correct RLS policies
-- Policy for users to view their own analyses
CREATE POLICY "Users can view their own company analyses" ON public.company_role_analyses
    FOR SELECT USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Policy for users to insert their own analyses
CREATE POLICY "Users can insert their own company analyses" ON public.company_role_analyses
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Policy for users to update their own analyses
CREATE POLICY "Users can update their own company analyses" ON public.company_role_analyses
    FOR UPDATE USING (
        user_id IN (
            SELECT up.id FROM public.user_profile up
            JOIN public.users u ON u.id = up.user_id
            WHERE u.clerk_id = public.get_current_clerk_user_id()
        )
    );

-- Service role policy for N8N access (this allows N8N to bypass RLS)
CREATE POLICY "Service role can manage company_role_analyses" 
ON public.company_role_analyses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
