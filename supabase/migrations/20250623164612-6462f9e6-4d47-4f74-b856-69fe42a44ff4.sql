
-- Completely reset and fix company_role_analyses RLS policies
-- Drop ALL existing policies first to ensure clean state
DROP POLICY IF EXISTS "Users can view their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can insert their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can update their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Users can delete their own company analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Service role can manage company_role_analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all select operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all insert operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all update operations on company role analyses" ON public.company_role_analyses;
DROP POLICY IF EXISTS "Allow all delete operations on company role analyses" ON public.company_role_analyses;

-- Disable RLS temporarily
ALTER TABLE public.company_role_analyses DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.company_role_analyses ENABLE ROW LEVEL SECURITY;

-- Create service role policy FIRST (highest priority)
CREATE POLICY "Service role bypass RLS" 
ON public.company_role_analyses 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create user policies for authenticated users
CREATE POLICY "Authenticated users can manage their own analyses" 
ON public.company_role_analyses 
FOR ALL 
TO authenticated
USING (
    user_id IN (
        SELECT up.id FROM public.user_profile up
        JOIN public.users u ON u.id = up.user_id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
) 
WITH CHECK (
    user_id IN (
        SELECT up.id FROM public.user_profile up
        JOIN public.users u ON u.id = up.user_id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- Grant necessary permissions to service_role
GRANT ALL ON public.company_role_analyses TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
