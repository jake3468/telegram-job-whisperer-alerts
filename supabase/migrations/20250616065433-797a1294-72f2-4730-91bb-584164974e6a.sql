
-- First, clean up duplicate records by keeping only the most recent one for each user
DELETE FROM public.user_credits 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.user_credits 
  ORDER BY user_id, created_at DESC
);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE public.user_credits 
ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);
