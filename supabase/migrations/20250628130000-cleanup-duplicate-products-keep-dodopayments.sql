
-- Clean up duplicate products, keeping only DodoPayments IDs
-- First, let's see what we have
SELECT product_id, product_name, product_type, credits_amount, price_amount, region, is_active 
FROM public.payment_products 
ORDER BY product_type, region, credits_amount;

-- Delete old product IDs, keeping only DodoPayments IDs (starting with pdt_ and longer format)
DELETE FROM public.payment_products 
WHERE product_id IN (
    'pdt_indian_30_credits',
    'pdt_indian_80_credits', 
    'pdt_indian_200_credits',
    'pdt_indian_500_credits',
    'pdt_indian_monthly_subscription',
    'pdt_global_30_credits',
    'pdt_global_80_credits',
    'pdt_global_200_credits', 
    'pdt_global_500_credits',
    'pdt_global_monthly_subscription'
);

-- Ensure all remaining products are active
UPDATE public.payment_products 
SET is_active = true, updated_at = NOW()
WHERE is_active = false;

-- Final verification - should only show DodoPayments IDs
SELECT product_id, product_name, product_type, credits_amount, price_amount, region, is_active 
FROM public.payment_products 
ORDER BY product_type, region, credits_amount;
