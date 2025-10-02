-- Update initialize_user_credits to give 0 initial credits to new users
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
  
  -- Insert initial credit record with 0 credits for new signups
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_id,
    0,
    0,
    0,
    'free',
    next_reset
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction with 0 credits
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
    0,
    0,
    0,
    'Initial 0 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$function$;

-- Update reset_monthly_credits to give 0 credits on monthly reset for ALL users
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  reset_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users whose free credits need to be reset (only free plan users now)
  FOR user_record IN
    SELECT user_id, current_balance, paid_credits
    FROM public.user_credits
    WHERE subscription_plan = 'free' 
    AND next_reset_date <= NOW()
  LOOP
    -- Reset free credits to 0, keep paid credits
    UPDATE public.user_credits
    SET 
      current_balance = user_record.paid_credits + 0,
      free_credits = 0,
      next_reset_date = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE user_id = user_record.user_id;
    
    -- Log the reset transaction
    INSERT INTO public.credit_transactions (
      user_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description
    ) VALUES (
      user_record.user_id,
      'free_monthly_reset',
      0 - (user_record.current_balance - user_record.paid_credits),
      user_record.current_balance,
      user_record.paid_credits + 0,
      'Monthly free credits reset (0 credits per month)'
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$function$;