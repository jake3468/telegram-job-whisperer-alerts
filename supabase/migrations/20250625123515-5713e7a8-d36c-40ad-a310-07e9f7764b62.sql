
-- Create payment_products table to store product configurations
CREATE TABLE public.payment_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('subscription', 'credit_pack')),
  credits_amount INTEGER NOT NULL,
  price_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payment_records table to track all payment events
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  subscription_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  product_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  amount DECIMAL(10,2),
  currency TEXT,
  status TEXT NOT NULL,
  payment_method TEXT,
  error_code TEXT,
  error_message TEXT,
  webhook_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES public.users(id),
  credits_awarded DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create subscription_tracking table to manage user subscriptions
CREATE TABLE public.subscription_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  subscription_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'failed')),
  next_billing_date TIMESTAMP WITH TIME ZONE,
  previous_billing_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subscription_id)
);

-- Insert default payment products
INSERT INTO public.payment_products (product_id, product_name, product_type, credits_amount, price_amount, currency, billing_cycle, description) VALUES
('pdt_NoeZBi7dtSLdIthX7TDoj', 'Premium Monthly', 'subscription', 200, 199.00, 'INR', 'monthly', '200 credits per month with auto-renewal'),
('pdt_credit_pack_50', 'Credit Pack 50', 'credit_pack', 50, 99.00, 'INR', 'one_time', '50 credits - no expiration'),
('pdt_credit_pack_100', 'Credit Pack 100', 'credit_pack', 100, 189.00, 'INR', 'one_time', '100 credits - no expiration'),
('pdt_credit_pack_200', 'Credit Pack 200', 'credit_pack', 200, 349.00, 'INR', 'one_time', '200 credits - no expiration'),
('pdt_credit_pack_500', 'Credit Pack 500', 'credit_pack', 500, 799.00, 'INR', 'one_time', '500 credits - no expiration');

-- Create function to process payment and award credits
CREATE OR REPLACE FUNCTION public.process_payment_credits(
  p_webhook_id TEXT,
  p_event_type TEXT,
  p_customer_email TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_product_id TEXT DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_amount DECIMAL DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_payment_id TEXT DEFAULT NULL,
  p_subscription_id TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_webhook_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  product_record RECORD;
  payment_record_id UUID;
  credits_to_award DECIMAL := 0;
  processing_result JSONB;
  subscription_record RECORD;
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

  -- Get product information if product_id provided
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
          -- Get subscription details from raw payload
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
    -- Handle failed payments
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
    -- Unknown event type or status
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
    -- Log error and return failure
    RAISE LOG 'Error processing payment webhook: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error processing payment: ' || SQLERRM,
      'error_details', SQLERRM
    );
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.payment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_products (public read)
CREATE POLICY "Everyone can view active payment products" 
  ON public.payment_products 
  FOR SELECT 
  USING (is_active = true);

-- Create RLS policies for payment_records (users can view their own)
CREATE POLICY "Users can view their own payment records" 
  ON public.payment_records 
  FOR SELECT 
  USING (user_id = public.get_current_user_uuid());

-- Create RLS policies for subscription_tracking (users can view their own)
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscription_tracking 
  FOR SELECT 
  USING (user_id = public.get_current_user_uuid());

-- Add updated_at triggers
CREATE TRIGGER update_payment_products_updated_at
  BEFORE UPDATE ON public.payment_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_tracking_updated_at
  BEFORE UPDATE ON public.subscription_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
