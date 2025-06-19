
-- First, let's see what policies exist on the credit_transactions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'credit_transactions';

-- Drop any existing policies on credit_transactions to start fresh
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_transactions;

-- Create a new policy with a unique name
CREATE POLICY "Users can view own credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.users 
  WHERE clerk_id = COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  )
));

-- Ensure the get_clerk_user_id function is properly defined
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
