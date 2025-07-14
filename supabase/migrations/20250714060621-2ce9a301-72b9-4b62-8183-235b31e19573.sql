-- Fix existing saved jobs that have null job_reference_id
UPDATE public.job_board 
SET job_reference_id = gen_random_uuid() 
WHERE is_saved_by_user = true 
AND job_reference_id IS NULL;