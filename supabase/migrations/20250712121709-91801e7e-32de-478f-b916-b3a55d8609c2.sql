-- First, let's clean up duplicate records, keeping only the latest one for each user
WITH latest_records AS (
  SELECT DISTINCT ON (user_id) 
    id, user_id, total_credits, used_credits, remaining_credits, created_at, updated_at
  FROM ai_interview_credits 
  ORDER BY user_id, created_at DESC
),
records_to_delete AS (
  SELECT ac.id 
  FROM ai_interview_credits ac
  LEFT JOIN latest_records lr ON ac.id = lr.id
  WHERE lr.id IS NULL
)
DELETE FROM ai_interview_credits 
WHERE id IN (SELECT id FROM records_to_delete);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE ai_interview_credits 
ADD CONSTRAINT unique_user_ai_interview_credits 
UNIQUE (user_id);

-- Update the initialize function to handle duplicates properly
CREATE OR REPLACE FUNCTION public.initialize_ai_interview_credits(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_record_id UUID;
  existing_record UUID;
BEGIN
  -- Check if record already exists
  SELECT id INTO existing_record 
  FROM public.ai_interview_credits 
  WHERE user_id = p_user_id;
  
  -- If record exists, return existing ID
  IF existing_record IS NOT NULL THEN
    RETURN existing_record;
  END IF;
  
  -- Insert initial AI interview credit record with 2 free credits
  INSERT INTO public.ai_interview_credits (
    user_id,
    total_credits,
    used_credits,
    remaining_credits
  ) VALUES (
    p_user_id,
    2,
    0,
    2
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction
  INSERT INTO public.ai_interview_transactions (
    user_id,
    transaction_type,
    credits_amount,
    credits_before,
    credits_after,
    description
  ) VALUES (
    p_user_id,
    'initial_signup',
    2,
    0,
    2,
    'Initial 2 free AI mock interview credits'
  );
  
  RETURN credit_record_id;
END;
$$;