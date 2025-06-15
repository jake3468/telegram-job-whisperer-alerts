
-- Initialize credits for all existing user profiles that don't have credit records yet
INSERT INTO public.user_credits (
  user_profile_id,
  current_balance,
  free_credits,
  paid_credits,
  subscription_plan,
  next_reset_date
)
SELECT 
  up.id,
  15,
  15,
  0,
  'free',
  NOW() + INTERVAL '30 days'
FROM public.user_profile up
LEFT JOIN public.user_credits uc ON uc.user_profile_id = up.id
WHERE uc.id IS NULL;

-- Log initial signup transactions for all existing users
INSERT INTO public.credit_transactions (
  user_profile_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  description
)
SELECT 
  up.id,
  'initial_signup',
  15,
  0,
  15,
  'Initial 15 free credits retroactively added'
FROM public.user_profile up
LEFT JOIN public.credit_transactions ct ON ct.user_profile_id = up.id AND ct.transaction_type = 'initial_signup'
WHERE ct.id IS NULL;
