-- Initialize AI interview credits for existing users who don't have them yet
INSERT INTO public.ai_interview_credits (user_id, total_credits, used_credits, remaining_credits)
SELECT u.id, 2, 0, 2
FROM public.users u
LEFT JOIN public.ai_interview_credits aic ON u.id = aic.user_id
WHERE aic.user_id IS NULL;

-- Add corresponding transaction records for existing users
INSERT INTO public.ai_interview_transactions (user_id, transaction_type, credits_amount, credits_before, credits_after, description)
SELECT u.id, 'initial_signup', 2, 0, 2, 'Initial 2 free AI mock interview credits (retroactive)'
FROM public.users u
JOIN public.ai_interview_credits aic ON u.id = aic.user_id
LEFT JOIN public.ai_interview_transactions ait ON u.id = ait.user_id AND ait.transaction_type = 'initial_signup'
WHERE ait.user_id IS NULL;