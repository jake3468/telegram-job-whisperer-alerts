-- Fix inconsistent RLS policies for job_analyses table
-- All policies should use get_current_clerk_user_id_reliable() for consistency

-- Drop existing inconsistent policies
DROP POLICY IF EXISTS "Users can view their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can delete their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can update their own job analyses" ON public.job_analyses;

-- Create consistent policies using get_current_clerk_user_id_reliable()
CREATE POLICY "Users can view their own job analyses" 
ON public.job_analyses 
FOR SELECT 
USING (user_id IN (
  SELECT up.id
  FROM user_profile up
  JOIN users u ON u.id = up.user_id
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can delete their own job analyses" 
ON public.job_analyses 
FOR DELETE 
USING (user_id IN (
  SELECT up.id
  FROM user_profile up
  JOIN users u ON u.id = up.user_id
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can update their own job analyses" 
ON public.job_analyses 
FOR UPDATE 
USING (user_id IN (
  SELECT up.id
  FROM user_profile up
  JOIN users u ON u.id = up.user_id
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));