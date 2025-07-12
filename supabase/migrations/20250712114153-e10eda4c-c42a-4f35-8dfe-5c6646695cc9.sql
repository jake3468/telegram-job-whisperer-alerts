-- Update AI Mock Interview pricing in payment_products table
UPDATE public.payment_products 
SET price_amount = CASE 
    WHEN credits_amount = 1 AND currency_code = 'USD' THEN 6.99
    WHEN credits_amount = 1 AND currency_code = 'INR' THEN 299
    WHEN credits_amount = 3 AND currency_code = 'USD' THEN 17.99
    WHEN credits_amount = 3 AND currency_code = 'INR' THEN 699
    WHEN credits_amount = 5 AND currency_code = 'USD' THEN 26.99
    WHEN credits_amount = 5 AND currency_code = 'INR' THEN 999
    ELSE price_amount
END
WHERE product_name LIKE '%AI Mock Interview%' AND is_active = true;