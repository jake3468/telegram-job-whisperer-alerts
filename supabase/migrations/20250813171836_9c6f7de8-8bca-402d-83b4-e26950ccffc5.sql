-- Fix security vulnerability in users table RLS policies
-- Remove overly permissive policies and restrict to proper roles

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow user creation from Clerk sync" ON public.users;
DROP POLICY IF EXISTS "Allow user updates from Clerk sync" ON public.users;

-- Create more secure policies for user creation and updates
-- Only service role can create users (for Clerk synchronization)
CREATE POLICY "Service role can create users" 
ON public.users 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Only service role can update users (for Clerk synchronization)  
CREATE POLICY "Service role can update users"
ON public.users
FOR UPDATE
TO service_role
USING (true);

-- Add policy for authenticated users to only access their own records
CREATE POLICY "Authenticated users can select their own record"
ON public.users
FOR SELECT
TO authenticated
USING (clerk_id = get_current_clerk_user_id());

-- Ensure no public access to users table
CREATE POLICY "Deny all public access to users"
ON public.users
FOR ALL
TO anon
USING (false);