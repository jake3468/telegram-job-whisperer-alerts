
-- Step 1: Drop existing functions first
DROP FUNCTION IF EXISTS public.initialize_user_credits(uuid);
DROP FUNCTION IF EXISTS public.check_sufficient_credits(uuid, numeric);
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.add_credits(uuid, numeric, text, text, boolean);

-- Step 2: Drop ALL existing RLS policies that depend on user_profile_id
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credit balance" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

-- Step 3: Add temporary columns to store the direct user_id references
ALTER TABLE public.user_credits ADD COLUMN temp_user_id uuid;
ALTER TABLE public.credit_transactions ADD COLUMN temp_user_id uuid;

-- Step 4: Populate the temporary columns with the actual user_id from user_profile
UPDATE public.user_credits 
SET temp_user_id = up.user_id
FROM public.user_profile up
WHERE user_credits.user_profile_id = up.id;

UPDATE public.credit_transactions 
SET temp_user_id = up.user_id
FROM public.user_profile up
WHERE credit_transactions.user_profile_id = up.id;

-- Step 5: Drop the old foreign key constraints
ALTER TABLE public.user_credits DROP CONSTRAINT IF EXISTS user_credits_user_profile_id_fkey;
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_profile_id_fkey;

-- Step 6: Drop the old columns
ALTER TABLE public.user_credits DROP COLUMN user_profile_id;
ALTER TABLE public.credit_transactions DROP COLUMN user_profile_id;

-- Step 7: Rename temporary columns to user_id
ALTER TABLE public.user_credits RENAME COLUMN temp_user_id TO user_id;
ALTER TABLE public.credit_transactions RENAME COLUMN temp_user_id TO user_id;

-- Step 8: Make user_id columns NOT NULL
ALTER TABLE public.user_credits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.credit_transactions ALTER COLUMN user_id SET NOT NULL;

-- Step 9: Add new foreign key constraints pointing to users.id
ALTER TABLE public.user_credits 
ADD CONSTRAINT user_credits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 10: Create new RLS policies using user_id
CREATE POLICY "Users can view their own credits" 
  ON public.user_credits 
  FOR SELECT 
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = public.get_clerk_user_id()
  ));

CREATE POLICY "Users can update their own credits" 
  ON public.user_credits 
  FOR UPDATE 
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = public.get_clerk_user_id()
  ));

CREATE POLICY "Users can insert their own credits" 
  ON public.user_credits 
  FOR INSERT 
  WITH CHECK (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = public.get_clerk_user_id()
  ));

CREATE POLICY "Users can view their own transactions" 
  ON public.credit_transactions 
  FOR SELECT 
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = public.get_clerk_user_id()
  ));

-- Step 11: Recreate the credit management functions with new signatures
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
  
  -- Insert initial credit record
  INSERT INTO public.user_credits (
    user_id,
    current_balance,
    free_credits,
    paid_credits,
    subscription_plan,
    next_reset_date
  ) VALUES (
    p_user_id,
    15,
    15,
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
    15,
    0,
    15,
    'Initial 15 free credits on signup'
  );
  
  RETURN credit_record_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_sufficient_credits(p_user_id UUID, p_required_credits DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits DECIMAL;
BEGIN
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_credits >= p_required_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID, 
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
  WHERE user_id = p_user_id
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
  WHERE user_id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    feature_used
  ) VALUES (
    p_user_id,
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

CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
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
  WHERE user_id = p_user_id
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
  WHERE user_id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    p_transaction_type,
    p_amount,
    current_credits,
    new_balance,
    COALESCE(p_description, 'Credits added: ' || p_transaction_type)
  );
  
  RETURN TRUE;
END;
$$;

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
    -- Reset free credits to 15, keep paid credits
    UPDATE public.user_credits
    SET 
      current_balance = user_record.paid_credits + 15,
      free_credits = 15,
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
      15 - (user_record.current_balance - user_record.paid_credits),
      user_record.current_balance,
      user_record.paid_credits + 15,
      'Monthly free credits reset (30 days from signup)'
    );
    
    reset_count := reset_count + 1;
  END LOOP;
  
  RETURN reset_count;
END;
$$;

-- Update the trigger function to use user_id directly
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize credits for new user profile using the user_id
  PERFORM public.initialize_user_credits(NEW.user_id);
  RETURN NEW;
END;
$$;
