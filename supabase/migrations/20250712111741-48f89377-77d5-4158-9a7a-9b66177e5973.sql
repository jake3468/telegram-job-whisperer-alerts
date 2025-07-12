-- Create AI Interview Credits table to track user's interview call credits
CREATE TABLE public.ai_interview_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_interview_credits ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_interview_credits
CREATE POLICY "Users can view their own AI interview credits" 
ON public.ai_interview_credits 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE clerk_id = get_current_clerk_user_id()));

CREATE POLICY "Users can update their own AI interview credits" 
ON public.ai_interview_credits 
FOR UPDATE 
USING (user_id IN (SELECT id FROM public.users WHERE clerk_id = get_current_clerk_user_id()));

CREATE POLICY "Service role can manage AI interview credits" 
ON public.ai_interview_credits 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can insert their own AI interview credits" 
ON public.ai_interview_credits 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE clerk_id = get_current_clerk_user_id()));

-- Create AI Interview Transactions table for audit trail
CREATE TABLE public.ai_interview_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'initial_signup', 'purchase', 'usage'
  credits_amount INTEGER NOT NULL, -- positive for additions, negative for usage
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  description TEXT,
  payment_record_id UUID REFERENCES public.payment_records(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_interview_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_interview_transactions
CREATE POLICY "Users can view their own AI interview transactions" 
ON public.ai_interview_transactions 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE clerk_id = get_current_clerk_user_id()));

CREATE POLICY "Service role can manage AI interview transactions" 
ON public.ai_interview_transactions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add payment products for AI Interview packs
INSERT INTO public.payment_products (
  product_id, product_name, product_type, credits_amount, price_amount, currency, currency_code, region, is_active
) VALUES 
-- USD Products
('ai_interview_1_usd', 'AI Mock Interview - 1 Call', 'ai_interview_pack', 1, 599, 'USD', 'USD', 'global', true),
('ai_interview_3_usd', 'AI Mock Interview - 3 Calls', 'ai_interview_pack', 3, 1499, 'USD', 'USD', 'global', true),
('ai_interview_5_usd', 'AI Mock Interview - 5 Calls', 'ai_interview_pack', 5, 2299, 'USD', 'USD', 'global', true),
-- INR Products  
('ai_interview_1_inr', 'AI Mock Interview - 1 Call', 'ai_interview_pack', 1, 24900, 'INR', 'INR', 'india', true),
('ai_interview_3_inr', 'AI Mock Interview - 3 Calls', 'ai_interview_pack', 3, 59900, 'INR', 'INR', 'india', true),
('ai_interview_5_inr', 'AI Mock Interview - 5 Calls', 'ai_interview_pack', 5, 89900, 'INR', 'INR', 'india', true);

-- Create function to initialize AI interview credits for new users
CREATE OR REPLACE FUNCTION public.initialize_ai_interview_credits(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  credit_record_id UUID;
BEGIN
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

-- Create function to add AI interview credits
CREATE OR REPLACE FUNCTION public.add_ai_interview_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_payment_record_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_total INTEGER;
  current_used INTEGER;
  new_total INTEGER;
  new_remaining INTEGER;
BEGIN
  -- Get current credits and lock the row
  SELECT total_credits, used_credits INTO current_total, current_used
  FROM public.ai_interview_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF current_total IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new totals
  new_total := current_total + p_amount;
  new_remaining := new_total - current_used;
  
  -- Update AI interview credits
  UPDATE public.ai_interview_credits
  SET 
    total_credits = new_total,
    remaining_credits = new_remaining,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.ai_interview_transactions (
    user_id,
    transaction_type,
    credits_amount,
    credits_before,
    credits_after,
    description,
    payment_record_id
  ) VALUES (
    p_user_id,
    'purchase',
    p_amount,
    current_total - current_used,
    new_remaining,
    COALESCE(p_description, 'AI interview credits purchased'),
    p_payment_record_id
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to use an AI interview credit
CREATE OR REPLACE FUNCTION public.use_ai_interview_credit(
  p_user_id UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_total INTEGER;
  current_used INTEGER;
  current_remaining INTEGER;
  new_used INTEGER;
  new_remaining INTEGER;
BEGIN
  -- Get current credits and lock the row
  SELECT total_credits, used_credits, remaining_credits 
  INTO current_total, current_used, current_remaining
  FROM public.ai_interview_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user has sufficient credits
  IF current_remaining IS NULL OR current_remaining < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new values
  new_used := current_used + 1;
  new_remaining := current_remaining - 1;
  
  -- Update AI interview credits
  UPDATE public.ai_interview_credits
  SET 
    used_credits = new_used,
    remaining_credits = new_remaining,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.ai_interview_transactions (
    user_id,
    transaction_type,
    credits_amount,
    credits_before,
    credits_after,
    description
  ) VALUES (
    p_user_id,
    'usage',
    -1,
    current_remaining,
    new_remaining,
    COALESCE(p_description, 'AI mock interview credit used')
  );
  
  RETURN TRUE;
END;
$$;

-- Create trigger to initialize AI interview credits for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_ai_interview_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize AI interview credits for new user profile
  PERFORM public.initialize_ai_interview_credits(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_user_profile_created_ai_credits
  AFTER INSERT ON public.user_profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_ai_interview_credits();