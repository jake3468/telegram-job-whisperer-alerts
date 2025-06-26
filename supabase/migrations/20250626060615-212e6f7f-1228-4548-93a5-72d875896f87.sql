
-- Remove old payment products that don't have proper regional classification
DELETE FROM public.payment_products 
WHERE product_name IN ('Credit Pack 50', 'Credit Pack 100', 'Credit Pack 200', 'Credit Pack 500', 'Premium Monthly')
AND region IS NULL OR region = 'global' AND product_id NOT LIKE 'pdt_global_%' AND product_id NOT LIKE 'pdt_indian_%';

-- Also remove any other old products that don't follow the new naming convention
DELETE FROM public.payment_products 
WHERE (product_id NOT LIKE 'pdt_global_%' AND product_id NOT LIKE 'pdt_indian_%') 
AND product_id != 'initial_free_credits'
AND created_at < '2025-06-26 05:00:00';
