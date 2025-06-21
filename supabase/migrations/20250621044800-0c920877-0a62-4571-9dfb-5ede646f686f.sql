
-- Check if the trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    action_statement,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table = 'company_role_analyses' 
AND trigger_schema = 'public';

-- Check if the trigger function exists
SELECT 
    p.proname as function_name,
    p.prosrc as function_source_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_company_role_analysis_webhook';

-- Check recent company role analyses to see the data structure
SELECT 
    id,
    user_id,
    company_name,
    location,
    job_title,
    created_at,
    updated_at,
    local_role_market_context IS NOT NULL as has_analysis_data
FROM public.company_role_analyses 
ORDER BY created_at DESC 
LIMIT 3;

-- Check if the N8N webhook URL secret exists
SELECT 
    name,
    CASE 
        WHEN decrypted_secret IS NOT NULL AND decrypted_secret != '' 
        THEN 'SECRET_EXISTS' 
        ELSE 'SECRET_MISSING' 
    END as status
FROM vault.decrypted_secrets 
WHERE name = 'N8N_COMPANY_WEBHOOK_URL';
