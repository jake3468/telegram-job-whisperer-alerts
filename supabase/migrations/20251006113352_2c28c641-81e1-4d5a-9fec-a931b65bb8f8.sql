-- Update initialize_user_credits function to give 5 free credits instead of 0
CREATE OR REPLACE FUNCTION public.initialize_user_credits(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  credit_record_id UUID;
  next_reset TIMESTAMP WITH TIME ZONE;
  existing_record UUID;
BEGIN
  -- Check if record already exists
  SELECT id INTO existing_record 
  FROM public.user_credits 
  WHERE user_id = p_user_id;
  
  -- If record exists, return existing ID
  IF existing_record IS NOT NULL THEN
    RETURN existing_record;
  END IF;
  
  -- Calculate next reset date (30 days from now)
  next_reset := NOW() + INTERVAL '30 days';
  
  -- Insert initial credit record with 5 credits for new signups
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_id,
    5,
    5,
    0,
    'free',
    next_reset
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction with 5 credits
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
    5,
    0,
    5,
    'Initial 5 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$function$;