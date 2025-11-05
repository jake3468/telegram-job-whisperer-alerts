-- Update initialize_user_credits function to give 8 free credits instead of 5
CREATE OR REPLACE FUNCTION public.initialize_user_credits(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_record_id UUID;
  existing_record UUID;
BEGIN
  -- Check if credit record already exists for this user
  SELECT id INTO existing_record 
  FROM public.user_credits 
  WHERE user_id = p_user_id;
  
  -- If record exists, return existing ID without creating duplicate
  IF existing_record IS NOT NULL THEN
    RETURN existing_record;
  END IF;
  
  -- Insert initial credit record with 8 free credits
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits
  ) VALUES (
    p_user_id,
    8,
    8,
    0
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction with 8 credits
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    'initial_signup',
    8,
    0,
    8,
    'Initial 8 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$$;