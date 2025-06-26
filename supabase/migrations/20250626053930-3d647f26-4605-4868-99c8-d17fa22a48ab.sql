
-- First, let's check what product types are allowed
SELECT DISTINCT product_type FROM public.payment_products;

-- Clean up old payment records that reference outdated products
DELETE FROM public.payment_records 
WHERE product_id IN (
    'monthly_premium', 
    'credit_pack_50', 
    'credit_pack_100', 
    'credit_pack_200', 
    'credit_pack_500'
) OR product_id NOT IN (
    SELECT product_id FROM public.payment_products WHERE is_active = true
);

-- Add missing payment records for initial signup credits for existing users
INSERT INTO public.payment_records (
    webhook_id,
    event_type,
    customer_email,
    customer_name,
    product_id,
    quantity,
    amount,
    currency,
    status,
    user_id,
    credits_awarded,
    processed,
    processed_at,
    webhook_timestamp,
    raw_payload,
    created_at
)
SELECT 
    'initial_signup_' || u.id::text as webhook_id,
    'initial_signup' as event_type,
    u.email as customer_email,
    COALESCE(u.first_name || ' ' || u.last_name, u.first_name, 'User') as customer_name,
    'initial_free_credits' as product_id,
    1 as quantity,
    0 as amount,
    'USD' as currency,
    'completed' as status,
    u.id as user_id,
    15 as credits_awarded,
    true as processed,
    uc.created_at as processed_at,
    uc.created_at as webhook_timestamp,
    jsonb_build_object(
        'type', 'initial_signup_bonus',
        'description', 'Initial 15 free credits on account creation'
    ) as raw_payload,
    uc.created_at as created_at
FROM public.users u
JOIN public.user_credits uc ON uc.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_records pr 
    WHERE pr.user_id = u.id 
    AND pr.event_type = 'initial_signup'
);

-- Update the process_payment_credits function to use payment_products instead of subscription_plans
CREATE OR REPLACE FUNCTION public.process_payment_credits(
    p_webhook_id text,
    p_event_type text,
    p_customer_email text,
    p_customer_name text DEFAULT NULL,
    p_product_id text DEFAULT NULL,
    p_quantity integer DEFAULT 1,
    p_amount numeric DEFAULT NULL,
    p_currency text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_payment_id text DEFAULT NULL,
    p_subscription_id text DEFAULT NULL,
    p_payment_method text DEFAULT NULL,
    p_error_code text DEFAULT NULL,
    p_error_message text DEFAULT NULL,
    p_webhook_timestamp timestamp with time zone DEFAULT now(),
    p_raw_payload jsonb DEFAULT '{}'::jsonb
)
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
  IF p_event_type IN ('payment.completed', 'subscription.renewed', 'subscription.created') AND p_status = 'active' THEN
    -- Award credits for successful payments
    IF credits_to_award > 0 THEN
      -- Add credits to user account
      PERFORM public.add_credits(
        user_record.id,
        credits_to_award,
        CASE 
          WHEN product_record.product_type = 'subscription' THEN 'subscription_add'
          ELSE 'credit_pack_purchase'
        END,
        'Credits from ' || product_record.product_name || ' purchase',
        true -- is_paid
      );

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
      'credits_awarded', credits_to_award,
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

-- Drop the subscription_plans table as it's no longer needed
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Add a special product entry for initial free credits (using 'credit_pack' type which should be valid)
INSERT INTO public.payment_products (
    product_id,
    product_name,
    product_type,
    credits_amount,
    price_amount,
    currency,
    currency_code,
    region,
    is_default_region,
    description,
    is_active
) VALUES (
    'initial_free_credits',
    'Initial Free Credits',
    'credit_pack',
    15,
    0,
    'USD',
    'USD',
    'global',
    true,
    'Initial 15 free credits given on account signup',
    true
) ON CONFLICT (product_id) DO NOTHING;
