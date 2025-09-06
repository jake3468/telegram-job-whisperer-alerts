-- Update the default value for free_credits column from 30 to 10
ALTER TABLE public.user_credits ALTER COLUMN free_credits SET DEFAULT 10;

-- Update existing records that still have 30 free_credits to 10 (only for free plan users)
UPDATE public.user_credits 
SET free_credits = 10,
    current_balance = paid_credits + 10
WHERE subscription_plan = 'free' 
AND free_credits = 30;