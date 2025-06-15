
-- Enable Row Level Security on the user_credits table. This is a safety measure
-- and won't cause issues if it's already enabled.
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read (SELECT) their own credit information.
-- This policy ensures a user can only access the credit row that belongs to their profile.
CREATE POLICY "Users can view their own credit balance"
ON public.user_credits
FOR SELECT
USING (
  user_profile_id IN (
    SELECT id FROM public.user_profile WHERE user_id = public.get_current_user_id_from_clerk()
  )
);
