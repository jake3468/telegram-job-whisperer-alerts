
-- Create function to deduct credits when job alerts are executed
CREATE OR REPLACE FUNCTION public.deduct_credits_for_job_alert_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Only proceed if last_run was actually updated (not just any update)
    IF OLD.last_run IS DISTINCT FROM NEW.last_run AND NEW.last_run IS NOT NULL THEN
        -- Get the user_id from the job_alerts entry by joining with user_profile
        SELECT up.user_id INTO user_uuid
        FROM public.user_profile up
        WHERE up.id = NEW.user_id;
        
        IF user_uuid IS NOT NULL THEN
            -- Deduct 1.5 credits for job alert execution
            SELECT public.deduct_credits(
                user_uuid,
                1.5,
                'job_alert_execution',
                'Credits deducted for job alert execution'
            ) INTO deduction_success;
            
            IF NOT deduction_success THEN
                RAISE LOG 'Failed to deduct credits for job alert execution. User: %, Alert ID: %', user_uuid, NEW.id;
            ELSE
                RAISE LOG 'Successfully deducted 1.5 credits for job alert execution. User: %, Alert ID: %', user_uuid, NEW.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically deduct credits when last_run is updated
DROP TRIGGER IF EXISTS trigger_deduct_credits_for_job_alert_run ON public.job_alerts;
CREATE TRIGGER trigger_deduct_credits_for_job_alert_run
    AFTER UPDATE ON public.job_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_credits_for_job_alert_run();
