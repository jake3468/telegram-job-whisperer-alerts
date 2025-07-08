-- Fix user_profile RLS policies to allow proper user profile creation
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;

-- Create comprehensive RLS policies for user_profile
CREATE POLICY "Users can insert their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (
  user_id IN (
    SELECT users.id 
    FROM users 
    WHERE users.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (
  user_id IN (
    SELECT users.id 
    FROM users 
    WHERE users.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (
  user_id IN (
    SELECT users.id 
    FROM users 
    WHERE users.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
  OR auth.role() = 'service_role'
)
WITH CHECK (
  user_id IN (
    SELECT users.id 
    FROM users 
    WHERE users.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can delete their own profile" 
ON public.user_profile 
FOR DELETE 
USING (
  user_id IN (
    SELECT users.id 
    FROM users 
    WHERE users.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
  OR auth.role() = 'service_role'
);