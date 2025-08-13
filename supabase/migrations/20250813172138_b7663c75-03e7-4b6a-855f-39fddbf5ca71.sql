-- Fix security vulnerabilities in payment_records table
-- Strengthen RLS policies to ensure payment data is properly protected

-- First, let's see current policies and drop them to rebuild securely
DROP POLICY IF EXISTS "Users can view their own payment records" ON public.payment_records;

-- Create comprehensive secure policies for payment_records table

-- 1. Service role can manage all payment records (needed for payment processing)
CREATE POLICY "Service role can manage all payment records"
ON public.payment_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can only view their own payment records with additional security checks
CREATE POLICY "Users can view only their own payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND user_id = get_current_user_uuid()
  AND auth.uid() IS NOT NULL
);

-- 3. Explicitly deny all access to anonymous users
CREATE POLICY "Deny all anonymous access to payment records"
ON public.payment_records
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. Deny all other operations for authenticated users (only service role can modify)
CREATE POLICY "Deny payment record modifications by users"
ON public.payment_records
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (false)
WITH CHECK (false);

-- Add additional security by creating a more robust user validation function
CREATE OR REPLACE FUNCTION public.get_current_user_uuid_secure()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    WHEN get_current_clerk_user_id_reliable() IS NULL THEN NULL
    ELSE (
      SELECT u.id
      FROM users u 
      WHERE u.clerk_id = get_current_clerk_user_id_reliable()
      AND auth.uid() IS NOT NULL
      LIMIT 1
    )
  END;
$$;

-- Update the user policy to use the more secure function
DROP POLICY IF EXISTS "Users can view only their own payment records" ON public.payment_records;

CREATE POLICY "Users can view only their own payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  user_id IS NOT NULL 
  AND user_id = get_current_user_uuid_secure()
  AND auth.uid() IS NOT NULL
);