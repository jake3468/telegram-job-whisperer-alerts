
-- Temporarily disable the RLS policy to test if data can be fetched without it
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

-- Create a temporary more permissive policy for debugging
CREATE POLICY "Temporary debug policy for transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (true);

-- Also add a function to help debug the JWT claims
CREATE OR REPLACE FUNCTION public.debug_jwt_claims()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb,
    '{}'::jsonb
  );
$$;
