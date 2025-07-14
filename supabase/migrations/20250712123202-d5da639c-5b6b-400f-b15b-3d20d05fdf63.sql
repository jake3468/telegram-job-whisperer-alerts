-- Clean up duplicate AI interview initial_signup transactions
-- Keep only the latest one per user based on created_at
DELETE FROM public.ai_interview_transactions 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, transaction_type 
             ORDER BY created_at DESC
           ) as rn
    FROM public.ai_interview_transactions 
    WHERE transaction_type = 'initial_signup'
  ) t 
  WHERE t.rn > 1
);

-- Add a comment for clarity
COMMENT ON TABLE public.ai_interview_transactions IS 'Tracks AI interview credit transactions with duplicate prevention';