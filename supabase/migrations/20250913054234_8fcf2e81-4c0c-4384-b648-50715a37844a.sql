-- Add referral tracking columns to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN referral_id TEXT,
ADD COLUMN referred_at TIMESTAMP WITH TIME ZONE;