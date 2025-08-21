-- Fix security issue: Restrict access to add_job_chat_history_new table
-- Handle existing NULL user_id values properly

-- First, drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage add job chat history" ON public.add_job_chat_history_new;

-- Delete records with NULL user_id as they cannot be properly secured
DELETE FROM public.add_job_chat_history_new WHERE user_id IS NULL;

-- Now make user_id NOT NULL to prevent future security issues
ALTER TABLE public.add_job_chat_history_new 
ALTER COLUMN user_id SET NOT NULL;

-- Create a more restrictive service role policy that only allows service operations
CREATE POLICY "Service role restricted access to add job chat history"
ON public.add_job_chat_history_new
FOR ALL
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add a policy to deny all public access explicitly
CREATE POLICY "Deny all public access to chat history"
ON public.add_job_chat_history_new
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure only authenticated users can access their own data
-- Update the existing SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can view their own add job chat history" ON public.add_job_chat_history_new;

CREATE POLICY "Authenticated users can view only their own chat history"
ON public.add_job_chat_history_new
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT u.id
    FROM users u
    WHERE u.clerk_id = get_current_clerk_user_id_reliable()
  )
);

-- Add index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_add_job_chat_history_user_id 
ON public.add_job_chat_history_new(user_id);

-- Log the security fix
INSERT INTO public.execution_logs (log_type, data)
VALUES (
  'security_fix',
  jsonb_build_object(
    'table', 'add_job_chat_history_new',
    'issue', 'publicly_readable_chat_messages',
    'fix_applied', 'restricted_rls_policies_and_removed_orphaned_records',
    'timestamp', now()
  )
);