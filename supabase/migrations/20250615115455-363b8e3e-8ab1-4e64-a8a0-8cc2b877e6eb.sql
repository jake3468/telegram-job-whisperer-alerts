
-- Check current users in user_profile table and their credit status
WITH user_profiles_without_credits AS (
  SELECT 
    up.id as user_profile_id,
    up.user_id,
    u.created_at as user_created_at,
    u.email,
    u.first_name,
    u.last_name
  FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  LEFT JOIN public.user_credits uc ON uc.user_profile_id = up.id
  WHERE uc.id IS NULL
)
INSERT INTO public.user_credits (
  user_profile_id,
  current_balance,
  free_credits,
  paid_credits,
  subscription_plan,
  next_reset_date
)
SELECT 
  user_profile_id,
  15 as current_balance,
  15 as free_credits,
  0 as paid_credits,
  'free' as subscription_plan,
  user_created_at + INTERVAL '30 days' as next_reset_date
FROM user_profiles_without_credits;

-- Also add initial signup transaction records for these users
WITH user_profiles_without_transactions AS (
  SELECT 
    up.id as user_profile_id,
    u.created_at as user_created_at
  FROM public.user_profile up
  JOIN public.users u ON u.id = up.user_id
  LEFT JOIN public.credit_transactions ct ON ct.user_profile_id = up.id AND ct.transaction_type = 'initial_signup'
  WHERE ct.id IS NULL
)
INSERT INTO public.credit_transactions (
  user_profile_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  description,
  created_at
)
SELECT 
  user_profile_id,
  'initial_signup' as transaction_type,
  15 as amount,
  0 as balance_before,
  15 as balance_after,
  'Initial 15 free credits on signup' as description,
  user_created_at
FROM user_profiles_without_transactions;
