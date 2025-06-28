
-- Update payment_products table with new pricing structure and consistent naming

-- First, clean up any duplicate or incorrect products
DELETE FROM public.payment_products 
WHERE product_name NOT IN ('Starter Credit Pack', 'Lite Credit Pack', 'Pro Credit Pack', 'Max Credit Pack', 'Monthly Subscription');

-- Update Indian products with new pricing and naming
UPDATE public.payment_products 
SET 
    product_name = 'Starter Credit Pack',
    credits_amount = 30,
    price_amount = 99,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_30_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Lite Credit Pack',
    credits_amount = 80,
    price_amount = 199,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_80_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Pro Credit Pack',
    credits_amount = 200,
    price_amount = 399,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_200_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Max Credit Pack',
    credits_amount = 500,
    price_amount = 799,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_500_credits' AND region = 'IN';

-- Update Global products with new pricing and naming
UPDATE public.payment_products 
SET 
    product_name = 'Starter Credit Pack',
    credits_amount = 30,
    price_amount = 2.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_30_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Lite Credit Pack',
    credits_amount = 80,
    price_amount = 4.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_80_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Pro Credit Pack',
    credits_amount = 200,
    price_amount = 9.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_200_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Max Credit Pack',
    credits_amount = 500,
    price_amount = 19.99,
    updated_at = NOW()
WHERE product_id = 'pdt_global_500_credits' AND region = 'global';

-- Update subscription products with new pricing and credits
UPDATE public.payment_products 
SET 
    product_name = 'Monthly Subscription',
    credits_amount = 300,
    price_amount = 499,
    updated_at = NOW()
WHERE product_type = 'subscription' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Monthly Subscription',
    credits_amount = 300,
    price_amount = 9.99,
    updated_at = NOW()
WHERE product_type = 'subscription' AND region = 'global';

-- Insert missing products if they don't exist
INSERT INTO public.payment_products (product_id, product_name, product_type, credits_amount, price_amount, currency, region, is_active)
VALUES 
    ('pdt_indian_30_credits', 'Starter Credit Pack', 'credit_pack', 30, 99, 'INR', 'IN', true),
    ('pdt_indian_80_credits', 'Lite Credit Pack', 'credit_pack', 80, 199, 'INR', 'IN', true),
    ('pdt_indian_200_credits', 'Pro Credit Pack', 'credit_pack', 200, 399, 'INR', 'IN', true),
    ('pdt_indian_500_credits', 'Max Credit Pack', 'credit_pack', 500, 799, 'INR', 'IN', true),
    ('pdt_indian_monthly_subscription', 'Monthly Subscription', 'subscription', 300, 499, 'INR', 'IN', true),
    ('pdt_global_30_credits', 'Starter Credit Pack', 'credit_pack', 30, 2.99, 'USD', 'global', true),
    ('pdt_global_80_credits', 'Lite Credit Pack', 'credit_pack', 80, 4.99, 'USD', 'global', true),
    ('pdt_global_200_credits', 'Pro Credit Pack', 'credit_pack', 200, 9.99, 'USD', 'global', true),
    ('pdt_global_500_credits', 'Max Credit Pack', 'credit_pack', 500, 19.99, 'USD', 'global', true),
    ('pdt_global_monthly_subscription', 'Monthly Subscription', 'subscription', 300, 9.99, 'USD', 'global', true)
ON CONFLICT (product_id) DO NOTHING;
