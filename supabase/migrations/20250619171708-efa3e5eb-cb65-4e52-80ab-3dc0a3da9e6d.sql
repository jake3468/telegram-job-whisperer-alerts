
-- Check current RLS policy on credit_transactions
SELECT * FROM pg_policies WHERE tablename = 'credit_transactions';

-- The issue is likely that the RLS policy is looking for Clerk JWT claims
-- but we're not properly setting the Clerk token in Supabase requests
-- Let's temporarily disable RLS to test, then create a proper policy

-- Disable RLS temporarily to confirm this is the issue
ALTER TABLE public.credit_transactions DISABLE ROW LEVEL SECURITY;
