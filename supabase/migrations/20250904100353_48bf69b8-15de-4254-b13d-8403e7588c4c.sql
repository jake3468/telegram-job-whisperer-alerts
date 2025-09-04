-- Step 1: Deactivate all subscription products
UPDATE public.payment_products 
SET is_active = false 
WHERE product_type = 'subscription';

-- Step 2: Update user_credits table - change free credits from 30 to 10
UPDATE public.user_credits 
SET 
  free_credits = 10,
  current_balance = paid_credits + 10,
  subscription_plan = 'free'
WHERE subscription_plan IN ('free', 'premium');

-- Step 3: Update the initialize_user_credits function to give 10 credits instead of 30
CREATE OR REPLACE FUNCTION public.initialize_user_credits(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  credit_record_id UUID;
  next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate next reset date (30 days from now)
  next_reset := NOW() + INTERVAL '30 days';
  
  -- Insert initial credit record with 10 credits instead of 30
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_id,
    10,
    10,
    0,
    'free',
    next_reset
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction with 10 credits
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
    10,
    0,
    10,
    'Initial 10 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$function$;

-- Step 4: Update the reset_monthly_credits function to reset to 10 credits instead of 30
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
    -- Reset free credits to 10, keep paid credits
    UPDATE public.user_credits
    SET 
      current_balance = user_record.paid_credits + 10,
      free_credits = 10,
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
      10 - (user_record.current_balance - user_record.paid_credits), -- Difference between old free credits and new
      user_record.current_balance,
      user_record.paid_credits + 10,
      'Monthly free credits reset (10 credits per month)'
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$function$;

-- Step 5: Update process_payment_credits function to remove subscription handling
CREATE OR REPLACE FUNCTION public.process_payment_credits(p_webhook_id text, p_event_type text, p_customer_email text, p_customer_name text DEFAULT NULL::text, p_product_id text DEFAULT NULL::text, p_quantity integer DEFAULT 1, p_amount numeric DEFAULT NULL::numeric, p_currency text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_payment_id text DEFAULT NULL::text, p_subscription_id text DEFAULT NULL::text, p_payment_method text DEFAULT NULL::text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_webhook_timestamp timestamp with time zone DEFAULT now(), p_raw_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
  product_record RECORD;
  payment_record_id UUID;
  credits_to_award DECIMAL := 0;
  processing_result JSONB;
  transaction_type_value TEXT;
  is_ai_interview_pack BOOLEAN := false;
BEGIN
  -- Check if webhook already processed
  IF EXISTS (SELECT 1 FROM public.payment_records WHERE webhook_id = p_webhook_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Webhook already processed',
      'webhook_id', p_webhook_id
    );
  END IF;

  -- Find user by email
  SELECT * INTO user_record 
  FROM public.users 
  WHERE email = p_customer_email;

  -- If user not found, create payment record but don't process credits
  IF user_record.id IS NULL THEN
    INSERT INTO public.payment_records (
      webhook_id, event_type, customer_email, customer_name, product_id, quantity,
      amount, currency, status, payment_id, subscription_id, payment_method,
      error_code, error_message, webhook_timestamp, raw_payload, processed
    ) VALUES (
      p_webhook_id, p_event_type, p_customer_email, p_customer_name, p_product_id, p_quantity,
      p_amount, p_currency, p_status, p_payment_id, p_subscription_id, p_payment_method,
      p_error_code, p_error_message, p_webhook_timestamp, p_raw_payload, false
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found for email: ' || p_customer_email,
      'user_created', false
    );
  END IF;

  -- Get product information from payment_products table (only credit packs now)
  IF p_product_id IS NOT NULL THEN
    SELECT * INTO product_record 
    FROM public.payment_products 
    WHERE product_id = p_product_id AND is_active = true AND product_type = 'credit_pack';
    
    IF product_record.id IS NOT NULL THEN
      credits_to_award := product_record.credits_amount * p_quantity;
      -- Check if this is an AI interview pack
      is_ai_interview_pack := (product_record.product_name LIKE '%AI Mock Interview%');
    END IF;
  END IF;

  -- Insert payment record
  INSERT INTO public.payment_records (
    webhook_id, event_type, customer_email, customer_name, product_id, quantity,
    amount, currency, status, payment_id, subscription_id, payment_method,
    error_code, error_message, webhook_timestamp, raw_payload, user_id, credits_awarded
  ) VALUES (
    p_webhook_id, p_event_type, p_customer_email, p_customer_name, p_product_id, p_quantity,
    p_amount, p_currency, p_status, p_payment_id, p_subscription_id, p_payment_method,
    p_error_code, p_error_message, p_webhook_timestamp, p_raw_payload, user_record.id, credits_to_award
  ) RETURNING id INTO payment_record_id;

  -- Process only credit pack purchases (no more subscription handling)
  IF p_event_type = 'payment.succeeded' AND p_status = 'succeeded' THEN
    -- Award credits for successful payments
    IF credits_to_award > 0 THEN
      transaction_type_value := 'credit_pack_purchase';

      -- Handle AI interview packs differently
      IF is_ai_interview_pack THEN
        -- Add AI interview credits
        PERFORM public.add_ai_interview_credits(
          user_record.id,
          credits_to_award::INTEGER,
          'AI interview credits from ' || product_record.product_name,
          payment_record_id
        );
      ELSE
        -- Add general credits to user account
        PERFORM public.add_credits(
          user_record.id,
          credits_to_award,
          transaction_type_value,
          'Credits from ' || product_record.product_name || ' (' || p_event_type || ')',
          true -- is_paid
        );
      END IF;
    END IF;

    -- Mark as processed
    UPDATE public.payment_records 
    SET processed = true, processed_at = NOW()
    WHERE id = payment_record_id;

    processing_result := jsonb_build_object(
      'success', true,
      'message', 'Payment processed successfully',
      'event_type', p_event_type,
      'transaction_type', transaction_type_value,
      'credits_awarded', credits_to_award,
      'is_ai_interview_pack', is_ai_interview_pack,
      'user_id', user_record.id
    );

  ELSIF p_event_type = 'payment.failed' THEN
    processing_result := jsonb_build_object(
      'success', true,
      'message', 'Failed payment recorded',
      'error_code', p_error_code,
      'error_message', p_error_message
    );

  ELSE
    processing_result := jsonb_build_object(
      'success', true,
      'message', 'Event recorded but not processed',
      'event_type', p_event_type,
      'status', p_status
    );
  END IF;

  RETURN processing_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error processing payment webhook: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error processing payment: ' || SQLERRM,
      'error_details', SQLERRM
    );
END;
$function$;