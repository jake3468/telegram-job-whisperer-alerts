
-- Clean up the 50 credit packs that still exist and update product names for better identification

-- Remove all 50 credit packs (they don't exist in the new pricing structure)
DELETE FROM public.payment_products 
WHERE product_id IN ('pdt_global_50_credits', 'pdt_indian_50_credits')
OR (credits_amount = 50 AND product_type = 'credit_pack');

-- Update product names to include region identifier for easier identification
-- This will help when you replace product_id with actual Dodo Payments IDs

-- Update Indian products to include "Indian" in the name
UPDATE public.payment_products 
SET 
    product_name = 'Indian Starter Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_30_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Indian Lite Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_80_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Indian Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_200_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Indian Max Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_indian_500_credits' AND region = 'IN';

UPDATE public.payment_products 
SET 
    product_name = 'Indian Monthly Subscription',
    updated_at = NOW()
WHERE product_type = 'subscription' AND region = 'IN';

-- Update Global products to include "Global" in the name
UPDATE public.payment_products 
SET 
    product_name = 'Global Starter Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_30_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Global Lite Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_80_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Global Pro Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_200_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Global Max Credit Pack',
    updated_at = NOW()
WHERE product_id = 'pdt_global_500_credits' AND region = 'global';

UPDATE public.payment_products 
SET 
    product_name = 'Global Monthly Subscription',
    updated_at = NOW()
WHERE product_type = 'subscription' AND region = 'global';

-- Also clean up any other inconsistent products that might exist
DELETE FROM public.payment_products 
WHERE credits_amount NOT IN (30, 80, 200, 300, 500)
AND product_id NOT LIKE 'initial_free_credits';
