-- Update the process_payment_credits function to handle AI interview packs
CREATE OR REPLACE FUNCTION public.process_payment_credits(p_webhook_id text, p_event_type text, p_customer_email text, p_customer_name text DEFAULT NULL::text, p_product_id text DEFAULT NULL::text, p_quantity integer DEFAULT 1, p_amount numeric DEFAULT NULL::numeric, p_currency text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_payment_id text DEFAULT NULL::text, p_subscription_id text DEFAULT NULL::text, p_payment_method text DEFAULT NULL::text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_webhook_timestamp timestamp with time zone DEFAULT now(), p_raw_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
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

  -- Get product information from payment_products table
  IF p_product_id IS NOT NULL THEN
    SELECT * INTO product_record 
    FROM public.payment_products 
    WHERE product_id = p_product_id AND is_active = true;
    
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

  -- Process based on event type and status
  IF p_event_type IN ('payment.succeeded', 'subscription.active', 'subscription.renewed') AND p_status IN ('succeeded', 'active') THEN
    -- Award credits for successful payments/subscriptions
    IF credits_to_award > 0 THEN
      -- Determine transaction type based on event type and product type
      IF p_event_type = 'payment.succeeded' THEN
        transaction_type_value := 'credit_pack_purchase';
      ELSIF p_event_type = 'subscription.active' THEN
        transaction_type_value := 'subscription_add';
      ELSIF p_event_type = 'subscription.renewed' THEN
        transaction_type_value := 'subscription_renewal';
      ELSE
        transaction_type_value := 'credit_pack_purchase';
      END IF;

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

      -- Update subscription plan if it's a subscription
      IF product_record.product_type = 'subscription' THEN
        UPDATE public.user_credits 
        SET subscription_plan = 'premium'
        WHERE user_id = user_record.id;

        -- Handle subscription tracking
        IF p_subscription_id IS NOT NULL THEN
          INSERT INTO public.subscription_tracking (
            user_id, subscription_id, product_id, status,
            next_billing_date, previous_billing_date
          ) VALUES (
            user_record.id, p_subscription_id, p_product_id, 'active',
            (p_raw_payload->'data'->>'next_billing_date')::timestamp with time zone,
            (p_raw_payload->'data'->>'previous_billing_date')::timestamp with time zone
          )
          ON CONFLICT (user_id, subscription_id) DO UPDATE SET
            status = 'active',
            next_billing_date = (p_raw_payload->'data'->>'next_billing_date')::timestamp with time zone,
            previous_billing_date = (p_raw_payload->'data'->>'previous_billing_date')::timestamp with time zone,
            updated_at = NOW();
        END IF;
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

  ELSIF p_event_type = 'subscription.cancelled' THEN
    -- Handle subscription cancellation
    IF p_subscription_id IS NOT NULL THEN
      UPDATE public.subscription_tracking 
      SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
      WHERE subscription_id = p_subscription_id;

      -- Update user's subscription plan back to free if no other active subscriptions
      IF NOT EXISTS (
        SELECT 1 FROM public.subscription_tracking 
        WHERE user_id = user_record.id AND status = 'active'
      ) THEN
        UPDATE public.user_credits 
        SET subscription_plan = 'free'
        WHERE user_id = user_record.id;
      END IF;
    END IF;

    processing_result := jsonb_build_object(
      'success', true,
      'message', 'Subscription cancelled',
      'subscription_id', p_subscription_id
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
$$;