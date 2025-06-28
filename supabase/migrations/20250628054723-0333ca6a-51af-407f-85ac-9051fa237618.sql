
-- Check all payment products to see what we have
SELECT product_id, product_name, product_type, credits_amount, price_amount, region, is_active 
FROM public.payment_products 
WHERE region = 'IN' 
ORDER BY product_type, credits_amount;

-- Ensure we have the Indian subscription product
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
('pdt_indian_monthly_subscription', 'Indian Monthly Subscription', 'subscription', 300, 499, 'INR', 'INR', 'IN', true)
ON CONFLICT (product_id) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    credits_amount = EXCLUDED.credits_amount,
    price_amount = EXCLUDED.price_amount,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify all products are active and have correct data
UPDATE public.payment_products 
SET is_active = true, updated_at = NOW()
WHERE region = 'IN';

-- Final verification
SELECT product_id, product_name, product_type, credits_amount, price_amount, currency, region, is_active 
FROM public.payment_products 
WHERE region = 'IN' 
ORDER BY product_type, credits_amount;
