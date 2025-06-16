
-- Fix RLS policies for user_credits table to properly allow access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credit balance" ON public.user_credits;

-- Create new RLS policies that properly check user ownership through the user_profile chain
CREATE POLICY "Users can view their own credit balance"
ON public.user_credits
FOR SELECT
USING (
  user_profile_id IN (
    SELECT up.id FROM public.user_profile up
    JOIN public.users u ON u.id = up.user_id
    WHERE u.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);

-- Policy for INSERT (creating new credit records)
CREATE POLICY "Users can insert their own credit balance"
ON public.user_credits
FOR INSERT
WITH CHECK (
  user_profile_id IN (
    SELECT up.id FROM public.user_profile up
    JOIN public.users u ON u.id = up.user_id
    WHERE u.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);

-- Policy for UPDATE (modifying credits)
CREATE POLICY "Users can update their own credit balance"
ON public.user_credits
FOR UPDATE
USING (
  user_profile_id IN (
    SELECT up.id FROM public.user_profile up
    JOIN public.users u ON u.id = up.user_id
    WHERE u.clerk_id = COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    )
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
