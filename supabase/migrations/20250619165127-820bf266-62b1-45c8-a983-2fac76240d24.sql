
-- Remove the temporary debug policy
DROP POLICY IF EXISTS "Temporary debug policy for transactions" ON public.credit_transactions;

-- Create the correct RLS policy that works with the current setup
-- Since we're using user_id directly from the users table, we need to match against that
CREATE POLICY "Users can view their own transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.users 
  WHERE clerk_id = public.get_clerk_user_id()
));

-- Also fix the get_clerk_user_id function to handle the Clerk JWT properly
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$$;
