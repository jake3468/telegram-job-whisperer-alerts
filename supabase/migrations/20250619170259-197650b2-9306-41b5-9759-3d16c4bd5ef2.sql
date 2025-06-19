
-- Re-enable RLS on credit_transactions table
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view their own transactions
-- This matches the pattern used in job_analyses and other tables
CREATE POLICY "Users can view their own credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);
