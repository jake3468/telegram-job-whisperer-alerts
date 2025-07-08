
-- Comprehensive fix for user_profile RLS policies to resolve merge conflicts and JWT issues
-- This migration simplifies the overly complex policies and provides reliable JWT extraction

-- Drop all existing problematic user_profile policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;

-- Create a dedicated, reliable function for JWT extraction
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id_reliable()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$$;

-- Create simplified, reliable RLS policies for user_profile
CREATE POLICY "Users can insert their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (
  user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (
  user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
  OR auth.role() = 'service_role'
)
WITH CHECK (
  user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can delete their own profile" 
ON public.user_profile 
FOR DELETE 
USING (
  user_id IN (
    SELECT u.id 
    FROM public.users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
  OR auth.role() = 'service_role'
);

-- Ensure RLS is enabled
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profile TO authenticated;
GRANT SELECT ON public.users TO authenticated;
