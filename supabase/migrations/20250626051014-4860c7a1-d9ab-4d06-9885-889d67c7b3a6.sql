
-- Add regional pricing support to payment_products table
ALTER TABLE public.payment_products 
ADD COLUMN region TEXT DEFAULT 'global',
ADD COLUMN currency_code TEXT DEFAULT 'USD',
ADD COLUMN is_default_region BOOLEAN DEFAULT false;

-- Create index for efficient region-based queries
CREATE INDEX IF NOT EXISTS idx_payment_products_region_active 
ON public.payment_products(region, is_active) WHERE is_active = true;

-- Insert INR products for Indian users
INSERT INTO public.payment_products (
  product_id, 
  product_name, 
  product_type, 
  credits_amount, 
  price_amount, 
  currency, 
  currency_code,
  region,
  is_default_region,
  description, 
  is_active
) VALUES 
-- Monthly subscription for India
('pdt_indian_monthly_subscription', 'Monthly Subscription (India)', 'subscription', 200, 199, 'INR', 'INR', 'IN', false, '200 credits every month for Indian users', true),

-- Credit packs for India
('pdt_indian_50_credits', '50 Credits Pack (India)', 'credit_pack', 50, 99, 'INR', 'INR', 'IN', false, '50 credits for Indian users', true),
('pdt_indian_100_credits', '100 Credits Pack (India)', 'credit_pack', 100, 189, 'INR', 'INR', 'IN', false, '100 credits for Indian users', true),
('pdt_indian_200_credits', '200 Credits Pack (India)', 'credit_pack', 200, 349, 'INR', 'INR', 'IN', false, '200 credits for Indian users', true),
('pdt_indian_500_credits', '500 Credits Pack (India)', 'credit_pack', 500, 799, 'INR', 'INR', 'IN', false, '500 credits for Indian users', true),

-- Global products for international users (USD)
('pdt_global_monthly_subscription', 'Monthly Subscription (Global)', 'subscription', 200, 4.99, 'USD', 'USD', 'global', true, '200 credits every month for international users', true),

-- Credit packs for international users
('pdt_global_50_credits', '50 Credits Pack (Global)', 'credit_pack', 50, 2.49, 'USD', 'USD', 'global', true, '50 credits for international users', true),
('pdt_global_100_credits', '100 Credits Pack (Global)', 'credit_pack', 100, 4.49, 'USD', 'USD', 'global', true, '100 credits for international users', true),
('pdt_global_200_credits', '200 Credits Pack (Global)', 'credit_pack', 200, 7.99, 'USD', 'USD', 'global', true, '200 credits for international users', true),
('pdt_global_500_credits', '500 Credits Pack (Global)', 'credit_pack', 500, 17.99, 'USD', 'USD', 'global', true, '500 credits for international users', true);

-- Update existing product to mark as default Indian product
UPDATE public.payment_products 
SET region = 'IN', currency_code = 'INR', is_default_region = false
WHERE product_id = 'pdt_NoeZBi7dtSLdIthX7TDoj';
