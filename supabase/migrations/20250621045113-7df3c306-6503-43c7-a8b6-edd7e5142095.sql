
-- Check if HTTP extension is enabled
SELECT * FROM pg_extension WHERE extname = 'http';

-- Check if the trigger exists and its current definition
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'company_role_analyses' 
AND t.trigger_schema = 'public';

-- Check recent company role analyses to see if any have been processed
SELECT 
    id,
    company_name,
    job_title,
    created_at,
    local_role_market_context IS NOT NULL as has_analysis_results
FROM public.company_role_analyses 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if the N8N webhook URL exists in secrets
SELECT 
    name,
    CASE 
        WHEN decrypted_secret IS NOT NULL AND decrypted_secret != '' 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as secret_status
FROM vault.decrypted_secrets 
WHERE name = 'N8N_COMPANY_WEBHOOK_URL';

-- Check if there are any webhook execution logs
SELECT COUNT(*) as webhook_execution_count
FROM public.webhook_executions 
WHERE request_type = 'company_role_analysis_created'
AND executed_at > NOW() - INTERVAL '1 hour';
