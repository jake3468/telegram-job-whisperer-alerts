
-- Create permissive RLS policies for credit_transactions table to match other tables
-- This follows the same pattern as job_alerts, user_profile, and job_cover_letters

-- First, ensure RLS is enabled
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;

-- Create permissive policies that allow all operations (like other tables)
-- Security is handled at the application layer with Clerk auth
CREATE POLICY "Allow all select operations on credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert operations on credit transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update operations on credit transactions" 
ON public.credit_transactions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete operations on credit transactions" 
ON public.credit_transactions 
FOR DELETE 
USING (true);
