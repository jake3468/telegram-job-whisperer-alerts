-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the monthly credit reset to run daily at 1 AM UTC
-- This will check all users and reset credits for those whose next_reset_date has passed
SELECT cron.schedule(
  'reset-monthly-credits',
  '0 1 * * *', -- Run daily at 1 AM UTC
  'SELECT public.reset_monthly_credits();'
);

-- Run the function once now to catch up any overdue users
SELECT public.reset_monthly_credits();