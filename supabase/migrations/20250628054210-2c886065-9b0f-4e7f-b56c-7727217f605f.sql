
-- Check current state of Indian credit products and fix any missing ones
-- First, let's see what we have
SELECT product_id, product_name, credits_amount, price_amount, region, is_active 
FROM public.payment_products 
WHERE region = 'IN' AND product_type = 'credit_pack' 
ORDER BY credits_amount;

-- Insert missing Indian credit packs if they don't exist
INSERT INTO public.payment_products (
    product_id, 
    product_name, 
    product_type, 
    credits_amount, 
    price_amount, 
    currency, 
    currency_code,
    region, 
    is_active
) VALUES 
-- Insert 80 credits pack if missing
('pdt_indian_80_credits', 'Indian Lite Credit Pack', 'credit_pack', 80, 199, 'INR', 'INR', 'IN', true),
-- Insert 500 credits pack if missing
('pdt_indian_500_credits', 'Indian Max Credit Pack', 'credit_pack', 500, 799, 'INR', 'INR', 'IN', true)
ON CONFLICT (product_id) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    credits_amount = EXCLUDED.credits_amount,
    price_amount = EXCLUDED.price_amount,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Ensure all Indian credit packs are active
UPDATE public.payment_products 
SET is_active = true, updated_at = NOW()
WHERE region = 'IN' AND product_type = 'credit_pack';

-- Verify the final state
SELECT product_id, product_name, credits_amount, price_amount, region, is_active 
FROM public.payment_products 
WHERE region = 'IN' AND product_type = 'credit_pack' 
ORDER BY credits_amount;
