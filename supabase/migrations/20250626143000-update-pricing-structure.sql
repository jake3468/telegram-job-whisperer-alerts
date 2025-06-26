
-- Update pricing structure: 30 credits signup bonus, new subscription pricing, and updated credit packs

-- Update existing payment products for new pricing structure
UPDATE public.payment_products 
SET 
    credits_amount = 300,
    price_amount = 499,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_monthly_subscription' AND region = 'IN';

UPDATE public.payment_products 
SET 
    credits_amount = 300,
    price_amount = 9.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_monthly_subscription' AND region = 'global';

-- Update existing credit packs for Indian region
UPDATE public.payment_products 
SET 
    credits_amount = 80,
    price_amount = 199,
    product_name = 'Lite Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_50_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    credits_amount = 200,
    price_amount = 399,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_100_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    credits_amount = 200,
    price_amount = 349,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_200_credits' AND region = 'IN';

-- Update existing credit packs for Global region
UPDATE public.payment_products 
SET 
    credits_amount = 80,
    price_amount = 4.99,
    product_name = 'Lite Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_50_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    credits_amount = 200,
    price_amount = 9.99,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_100_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    credits_amount = 200,
    price_amount = 7.99,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_200_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    price_amount = 19.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_500_credits' AND region = 'global';

-- Insert new Starter credit packs
INSERT INTO public.payment_products (
    product_id, product_name, product_type, credits_amount, price_amount,
    currency, currency_code, region, is_default_region, description, is_active
) VALUES
-- Indian Starter Pack
('pdt_indian_30_credits', 'Starter Credit Pack', 'credit_pack', 30, 99,
 'INR', 'INR', 'IN', false, '30 credits - perfect for getting started', true),
-- Global Starter Pack
('pdt_global_30_credits', 'Starter Credit Pack', 'credit_pack', 30, 2.99,
 'USD', 'USD', 'global', true, '30 credits - perfect for getting started', true)
ON CONFLICT (product_id) DO UPDATE SET
    credits_amount = EXCLUDED.credits_amount,
    price_amount = EXCLUDED.price_amount,
    product_name = EXCLUDED.product_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Update the initial free credits product
UPDATE public.payment_products 
SET 
    credits_amount = 30,
    description = 'Initial 30 free credits given on account signup',
    updated_at = NOW()
WHERE product_id = 'initial_free_credits';

-- Update the initialize_user_credits function to give 30 credits instead of 15
CREATE OR REPLACE FUNCTION public.initialize_user_credits(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_record_id UUID;
  next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate next reset date (30 days from now)
  next_reset := NOW() + INTERVAL '30 days';
  
  -- Insert initial credit record with 30 credits
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_id,
    30,
    30,
    0,
    'free',
    next_reset
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction
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
    30,
    0,
    30,
    'Initial 30 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$$;

-- Update the reset_monthly_credits function to give 30 credits instead of 15
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users whose free credits need to be reset
  FOR user_record IN
    SELECT user_id, current_balance, paid_credits
    FROM public.user_credits
    WHERE subscription_plan = 'free' 
    AND next_reset_date <= NOW()
  LOOP
    -- Reset free credits to 30, keep paid credits
    UPDATE public.user_credits
    SET 
      current_balance = user_record.paid_credits + 30,
      free_credits = 30,
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
      30 - (user_record.current_balance - user_record.paid_credits), -- Difference between old free credits and new
      user_record.current_balance,
      user_record.paid_credits + 30,
      'Monthly free credits reset (30 days from signup)'
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$$;

-- Update default free_credits in user_credits table
ALTER TABLE public.user_credits ALTER COLUMN free_credits SET DEFAULT 30;
