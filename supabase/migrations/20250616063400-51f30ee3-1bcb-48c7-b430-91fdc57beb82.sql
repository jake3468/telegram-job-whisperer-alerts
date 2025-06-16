
-- Drop existing RLS policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credit balance" ON public.user_credits;

-- Create new RLS policies that work with Clerk JWT tokens
CREATE POLICY "Users can view their own credit balance"
ON public.user_credits
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

CREATE POLICY "Users can insert their own credit balance"
ON public.user_credits
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);

CREATE POLICY "Users can update their own credit balance"
ON public.user_credits
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);

-- Also fix the credit_transactions table RLS policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own transactions" 
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

-- Ensure RLS is enabled
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
