-- Fix critical security issue: resume_chat_history_new table is publicly readable
-- Current policy allows anyone to access all resume chat conversations

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own resume chat history" ON public.resume_chat_history_new;

-- Add a user_id column to properly associate chat sessions with users
-- This is essential for proper access control
ALTER TABLE public.resume_chat_history_new 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Create an index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_resume_chat_history_user_id ON public.resume_chat_history_new(user_id);

-- Create proper RLS policies that restrict access to user's own chat history
CREATE POLICY "Users can view their own resume chat history" 
ON public.resume_chat_history_new 
FOR SELECT 
TO authenticated 
USING (user_id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can insert their own resume chat history" 
ON public.resume_chat_history_new 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can update their own resume chat history" 
ON public.resume_chat_history_new 
FOR UPDATE 
TO authenticated 
USING (user_id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
))
WITH CHECK (user_id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can delete their own resume chat history" 
ON public.resume_chat_history_new 
FOR DELETE 
TO authenticated 
USING (user_id IN (
  SELECT u.id 
  FROM public.users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

-- Service role policy for system operations
CREATE POLICY "Service role can manage resume chat history" 
ON public.resume_chat_history_new 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add comment documenting the security fix
COMMENT ON TABLE public.resume_chat_history_new IS 'Resume chat history with RLS enforced - users can only access their own chat sessions';

-- Note: Existing records will have NULL user_id and will need to be updated
-- or deleted if they cannot be properly associated with users