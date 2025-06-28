
-- Remove the description column from payment_products table
ALTER TABLE public.payment_products DROP COLUMN IF EXISTS description;
