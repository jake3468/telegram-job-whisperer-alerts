-- Add DELETE policy for users to delete their own job board posts
CREATE POLICY "Users can delete their own job board posts" 
ON public.job_board 
FOR DELETE 
USING (user_id IN ( 
  SELECT up.id
  FROM (user_profile up
    JOIN users u ON ((u.id = up.user_id)))
  WHERE (u.clerk_id = get_current_clerk_user_id())
));