
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profile;

-- Create a function to get the current user's database ID from their Clerk ID
CREATE OR REPLACE FUNCTION public.get_current_user_id_from_clerk()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.users 
  WHERE clerk_id = COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$$;

-- Create new policies using the correct function
CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (user_id = public.get_current_user_id_from_clerk());

CREATE POLICY "Users can create their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (user_id = public.get_current_user_id_from_clerk());

CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (user_id = public.get_current_user_id_from_clerk());

CREATE POLICY "Users can delete their own profile" 
ON public.user_profile 
FOR DELETE 
USING (user_id = public.get_current_user_id_from_clerk());
