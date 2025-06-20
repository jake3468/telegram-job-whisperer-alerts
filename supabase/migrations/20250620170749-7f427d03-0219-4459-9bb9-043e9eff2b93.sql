
-- Check if the company role analysis webhook trigger exists and is properly configured
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing,
    t.event_object_table
FROM information_schema.triggers t
WHERE t.event_object_table = 'company_role_analyses'
AND t.trigger_schema = 'public';

-- Also check if the trigger function exists
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_company_role_analysis_webhook';

-- Check recent company role analyses to see if they have been processed
SELECT 
    id,
    company_name,
    job_title,
    location,
    created_at,
    local_role_market_context IS NOT NULL as has_analysis_data
FROM public.company_role_analyses 
ORDER BY created_at DESC 
LIMIT 5;
