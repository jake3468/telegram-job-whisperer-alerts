
-- Phase 1: Create Credit Management Tables

-- 1.1 User Credits Table
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_credits DECIMAL(10,2) NOT NULL DEFAULT 15,
  paid_credits DECIMAL(10,2) NOT NULL DEFAULT 0,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  next_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_profile_credits UNIQUE(user_profile_id),
  CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('free', 'premium', 'credit_pack')),
  CONSTRAINT non_negative_credits CHECK (current_balance >= 0 AND free_credits >= 0 AND paid_credits >= 0)
);

-- 1.2 Credit Transactions Table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  feature_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('free_monthly_reset', 'subscription_add', 'feature_usage', 'manual_adjustment', 'credit_pack_purchase', 'initial_signup'))
);

-- 1.3 Subscription Plans Table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  credits_amount DECIMAL(10,2) NOT NULL,
  price_amount DECIMAL(10,2),
  billing_cycle TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('free', 'subscription', 'credit_pack')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'one_time', NULL))
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_name, plan_type, credits_amount, price_amount, billing_cycle, description) VALUES
('Free Plan', 'free', 15, 0, 'monthly', '15 credits reset every 30 days from signup'),
('Premium Monthly', 'subscription', 200, 29.99, 'monthly', '200 credits per month with auto-renewal'),
('Credit Pack 50', 'credit_pack', 50, 9.99, 'one_time', '50 credits - no expiration'),
('Credit Pack 100', 'credit_pack', 100, 18.99, 'one_time', '100 credits - no expiration'),
('Credit Pack 200', 'credit_pack', 200, 34.99, 'one_time', '200 credits - no expiration'),
('Credit Pack 500', 'credit_pack', 500, 79.99, 'one_time', '500 credits - no expiration');

-- Phase 2: Credit Management Functions

-- 2.1 Initialize user credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits(p_user_profile_id UUID)
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
  
  -- Insert initial credit record
  INSERT INTO public.user_credits (
    user_profile_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_profile_id,
    15,
    15,
    0,
    'free',
    next_reset
  ) RETURNING id INTO credit_record_id;
  
  -- Log the initial signup transaction
  INSERT INTO public.credit_transactions (
    user_profile_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_profile_id,
    'initial_signup',
    15,
    0,
    15,
    'Initial 15 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$$;

-- 2.2 Check if user has sufficient credits
CREATE OR REPLACE FUNCTION public.check_sufficient_credits(p_user_profile_id UUID, p_required_credits DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits DECIMAL;
BEGIN
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_profile_id = p_user_profile_id;
  
  IF current_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_credits >= p_required_credits;
END;
$$;

-- 2.3 Deduct credits from user account
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_profile_id UUID, 
  p_amount DECIMAL, 
  p_feature_used TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits DECIMAL;
  new_balance DECIMAL;
  success BOOLEAN := FALSE;
BEGIN
  -- Get current balance and lock the row
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_profile_id = p_user_profile_id
  FOR UPDATE;
  
  -- Check if user has sufficient credits
  IF current_credits IS NULL OR current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits - p_amount;
  
  -- Update user credits
  UPDATE public.user_credits
  SET 
    current_balance = new_balance,
    updated_at = NOW()
  WHERE user_profile_id = p_user_profile_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_profile_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    feature_used
  ) VALUES (
    p_user_profile_id,
    'feature_usage',
    -p_amount,
    current_credits,
    new_balance,
    COALESCE(p_description, 'Credits deducted for ' || p_feature_used),
    p_feature_used
  );
  
  RETURN TRUE;
END;
$$;

-- 2.4 Add credits to user account
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_profile_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_paid BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits DECIMAL;
  new_balance DECIMAL;
BEGIN
  -- Get current balance and lock the row
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_profile_id = p_user_profile_id
  FOR UPDATE;
  
  IF current_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits + p_amount;
  
  -- Update user credits
  UPDATE public.user_credits
  SET 
    current_balance = new_balance,
    paid_credits = CASE 
      WHEN p_is_paid THEN paid_credits + p_amount 
      ELSE paid_credits 
    END,
    free_credits = CASE 
      WHEN NOT p_is_paid THEN free_credits + p_amount 
      ELSE free_credits 
    END,
    updated_at = NOW()
  WHERE user_profile_id = p_user_profile_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_profile_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_profile_id,
    p_transaction_type,
    p_amount,
    current_credits,
    new_balance,
    COALESCE(p_description, 'Credits added: ' || p_transaction_type)
  );
  
  RETURN TRUE;
END;
$$;

-- 2.5 Reset monthly credits for free plan users
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
    SELECT user_profile_id, current_balance, paid_credits
    FROM public.user_credits
    WHERE subscription_plan = 'free' 
    AND next_reset_date <= NOW()
  LOOP
    -- Reset free credits to 15, keep paid credits
    UPDATE public.user_credits
    SET 
      current_balance = user_record.paid_credits + 15,
      free_credits = 15,
      next_reset_date = NOW() + INTERVAL '30 days',
      updated_at = NOW()
    WHERE user_profile_id = user_record.user_profile_id;
    
    -- Log the reset transaction
    INSERT INTO public.credit_transactions (
      user_profile_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      description
    ) VALUES (
      user_record.user_profile_id,
      'free_monthly_reset',
      15 - (user_record.current_balance - user_record.paid_credits), -- Difference between old free credits and new
      user_record.current_balance,
      user_record.paid_credits + 15,
      'Monthly free credits reset (30 days from signup)'
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$$;

-- Phase 3: Create triggers for automatic credit initialization
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize credits for new user profile
  PERFORM public.initialize_user_credits(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to automatically create credits when user_profile is created
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Phase 4: Add RLS policies for credit tables

-- Enable RLS on all credit tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- User Credits RLS Policies
CREATE POLICY "Users can view their own credits" 
  ON public.user_credits 
  FOR SELECT 
  USING (user_profile_id IN (
    SELECT up.id FROM public.user_profile up 
    JOIN public.users u ON u.id = up.user_id 
    WHERE u.clerk_id = public.get_clerk_user_id()
  ));

CREATE POLICY "Users can update their own credits" 
  ON public.user_credits 
  FOR UPDATE 
  USING (user_profile_id IN (
    SELECT up.id FROM public.user_profile up 
    JOIN public.users u ON u.id = up.user_id 
    WHERE u.clerk_id = public.get_clerk_user_id()
  ));

-- Credit Transactions RLS Policies
CREATE POLICY "Users can view their own transactions" 
  ON public.credit_transactions 
  FOR SELECT 
  USING (user_profile_id IN (
    SELECT up.id FROM public.user_profile up 
    JOIN public.users u ON u.id = up.user_id 
    WHERE u.clerk_id = public.get_clerk_user_id()
  ));

-- Subscription Plans RLS Policies (public read access)
CREATE POLICY "Everyone can view subscription plans" 
  ON public.subscription_plans 
  FOR SELECT 
  USING (is_active = true);

-- Phase 5: Remove old credits column from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS credits;

-- Add updated_at trigger for user_credits table
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
