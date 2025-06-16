
-- Initialize credits for existing users who don't have credit records yet
INSERT INTO public.user_credits (
  user_id,
  current_balance,
  free_credits,
  paid_credits,
  subscription_plan,
  next_reset_date
)
SELECT 
  u.id,
  15,
  15,
  0,
  'free',
  NOW() + INTERVAL '30 days'
FROM public.users u
LEFT JOIN public.user_credits uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL;

-- Log initial signup transactions for these users
INSERT INTO public.credit_transactions (
  user_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  description
)
SELECT 
  u.id,
  'initial_signup',
  15,
  0,
  15,
  'Initial 15 free credits on signup (retroactive)'
FROM public.users u
LEFT JOIN public.credit_transactions ct ON u.id = ct.user_id AND ct.transaction_type = 'initial_signup'
WHERE ct.user_id IS NULL;
