
-- Fix product naming inconsistencies in payment_products table

-- Update Indian products to have consistent naming and correct credit amounts
UPDATE public.payment_products 
SET 
    product_name = 'Starter Credit Pack',
    credits_amount = 30,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_30_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Basic Credit Pack',
    credits_amount = 80,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_80_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Pro Credit Pack',
    credits_amount = 200,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_200_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Premium Credit Pack',
    credits_amount = 500,
    updated_at = NOW()
WHERE product_id = 'pdt_indian_500_credits' AND region = 'IN';

-- Update Global/USD products to have consistent naming and correct credit amounts
UPDATE public.payment_products 
SET 
    product_name = 'Starter Credit Pack',
    credits_amount = 30,
    updated_at = NOW()
WHERE product_id = 'pdt_global_30_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Basic Credit Pack',
    credits_amount = 80,
    updated_at = NOW()
WHERE product_id = 'pdt_global_80_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Pro Credit Pack',
    credits_amount = 200,
    updated_at = NOW()
WHERE product_id = 'pdt_global_200_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Premium Credit Pack',
    credits_amount = 500,
    updated_at = NOW()
WHERE product_id = 'pdt_global_500_credits' AND region = 'global';

-- Ensure subscription products have correct naming
UPDATE public.payment_products 
SET 
    product_name = 'Monthly Subscription',
    updated_at = NOW()
WHERE product_type = 'subscription';
