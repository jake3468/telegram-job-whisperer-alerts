
-- First, let's check the current RLS policies on user_credits table and fix them
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credit balance" ON public.user_credits;

-- Create comprehensive RLS policies for user_credits table
-- Policy for SELECT (viewing credits)
CREATE POLICY "Users can view their own credit balance"
ON public.user_credits
FOR SELECT
USING (
  user_profile_id IN (
    SELECT id FROM public.user_profile WHERE user_id = public.get_current_user_id_from_clerk()
  )
);

-- Policy for INSERT (creating new credit records)
CREATE POLICY "Users can insert their own credit balance"
ON public.user_credits
FOR INSERT
WITH CHECK (
  user_profile_id IN (
    SELECT id FROM public.user_profile WHERE user_id = public.get_current_user_id_from_clerk()
  )
);

-- Policy for UPDATE (modifying credits)
CREATE POLICY "Users can update their own credit balance"
ON public.user_credits
FOR UPDATE
USING (
  user_profile_id IN (
    SELECT id FROM public.user_profile WHERE user_id = public.get_current_user_id_from_clerk()
  )
);

-- Ensure RLS is enabled on user_credits table
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
