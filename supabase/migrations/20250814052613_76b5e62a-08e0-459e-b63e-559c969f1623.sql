-- Fix the users table RLS policy by removing auth.uid() checks
-- since Clerk JWTs contain string user IDs, not UUIDs

DROP POLICY IF EXISTS "Users can view only their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update only their own record" ON public.users;

-- Recreate the policies without auth.uid() checks
CREATE POLICY "Users can view only their own record" 
ON public.users 
FOR SELECT 
USING (
  (clerk_id IS NOT NULL) 
  AND (clerk_id = get_current_clerk_user_id_reliable()) 
  AND (length(clerk_id) > 0)
);

CREATE POLICY "Users can update only their own record" 
ON public.users 
FOR UPDATE 
USING (
  (clerk_id IS NOT NULL) 
  AND (clerk_id = get_current_clerk_user_id_reliable()) 
  AND (length(clerk_id) > 0)
) 
WITH CHECK (
  (clerk_id IS NOT NULL) 
  AND (clerk_id = get_current_clerk_user_id_reliable()) 
  AND (length(clerk_id) > 0)
);