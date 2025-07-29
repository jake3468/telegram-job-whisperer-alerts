-- Schedule cleanup to run every 25 hours using pg_cron
-- First make sure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job
SELECT cron.schedule(
    'cleanup-job-telegram-uk-every-25-hours',
    '0 */25 * * *',
    'SELECT public.cleanup_old_job_telegram_uk_data();'
);