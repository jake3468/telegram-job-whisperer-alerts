
-- Remove old 200 credit packs that have incorrect pricing
DELETE FROM public.payment_products 
WHERE product_id = 'pdt_indian_200_credits' AND price_amount = 349 AND region = 'IN';

DELETE FROM public.payment_products 
WHERE product_id = 'pdt_global_200_credits' AND price_amount = 7.99 AND region = 'global';

-- Ensure we have the correct 200 credit packs with proper product IDs
UPDATE public.payment_products 
SET 
    product_id = 'pdt_indian_200_credits',
    credits_amount = 200,
    price_amount = 399,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE credits_amount = 200 AND region = 'IN' AND price_amount = 399;

UPDATE public.payment_products 
SET 
    product_id = 'pdt_global_200_credits',
    credits_amount = 200,
    price_amount = 9.99,
    product_name = 'Pro Credit Pack',
    updated_at = NOW()
WHERE credits_amount = 200 AND region = 'global' AND price_amount = 9.99;
