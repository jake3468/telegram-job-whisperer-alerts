
-- Create triggers to automatically deduct 1.5 credits when rows are inserted into job tables

-- Trigger function for job_analyses table
CREATE OR REPLACE FUNCTION deduct_credits_for_job_analysis()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Get the user_id from user_profile table
    SELECT up.user_id INTO user_uuid
    FROM public.user_profile up
    WHERE up.id = NEW.user_id;
    
    IF user_uuid IS NOT NULL THEN
        -- Deduct 1.5 credits for job analysis
        SELECT public.deduct_credits(
            user_uuid,
            1.5,
            'job_analysis',
            'Credits deducted for job analysis generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for job analysis. User: %, Analysis ID: %', user_uuid, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for job analysis. User: %, Analysis ID: %', user_uuid, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for job_cover_letters table
CREATE OR REPLACE FUNCTION deduct_credits_for_cover_letter()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Get the user_id from user_profile table
    SELECT up.user_id INTO user_uuid
    FROM public.user_profile up
    WHERE up.id = NEW.user_id;
    
    IF user_uuid IS NOT NULL THEN
        -- Deduct 1.5 credits for cover letter
        SELECT public.deduct_credits(
            user_uuid,
            1.5,
            'cover_letter',
            'Credits deducted for cover letter generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for cover letter. User: %, Letter ID: %', user_uuid, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for cover letter. User: %, Letter ID: %', user_uuid, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for job_linkedin table
CREATE OR REPLACE FUNCTION deduct_credits_for_linkedin_post()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Get the user_id from user_profile table
    SELECT up.user_id INTO user_uuid
    FROM public.user_profile up
    WHERE up.id = NEW.user_id;
    
    IF user_uuid IS NOT NULL THEN
        -- Deduct 1.5 credits for LinkedIn post
        SELECT public.deduct_credits(
            user_uuid,
            1.5,
            'linkedin_post',
            'Credits deducted for LinkedIn post generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for LinkedIn post. User: %, Post ID: %', user_uuid, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for LinkedIn post. User: %, Post ID: %', user_uuid, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for job_alerts table last_run updates
CREATE OR REPLACE FUNCTION deduct_credits_for_job_alert_run()
RETURNS TRIGGER AS $$
DECLARE
    deduction_success BOOLEAN;
BEGIN
    -- Only deduct credits if last_run column was actually updated
    IF OLD.last_run IS DISTINCT FROM NEW.last_run AND NEW.last_run IS NOT NULL THEN
        -- Deduct 1.5 credits for job alert run
        SELECT public.deduct_credits(
            NEW.user_id,
            1.5,
            'job_alert',
            'Credits deducted for job alert execution'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for job alert run. User: %, Alert ID: %', NEW.user_id, NEW.id;
        ELSE
            RAISE LOG 'Successfully deducted 1.5 credits for job alert run. User: %, Alert ID: %', NEW.user_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the actual triggers
DROP TRIGGER IF EXISTS trigger_deduct_credits_job_analysis ON public.job_analyses;
CREATE TRIGGER trigger_deduct_credits_job_analysis
    AFTER INSERT ON public.job_analyses
    FOR EACH ROW EXECUTE FUNCTION deduct_credits_for_job_analysis();

DROP TRIGGER IF EXISTS trigger_deduct_credits_cover_letter ON public.job_cover_letters;
CREATE TRIGGER trigger_deduct_credits_cover_letter
    AFTER INSERT ON public.job_cover_letters
    FOR EACH ROW EXECUTE FUNCTION deduct_credits_for_cover_letter();

DROP TRIGGER IF EXISTS trigger_deduct_credits_linkedin_post ON public.job_linkedin;
CREATE TRIGGER trigger_deduct_credits_linkedin_post
    AFTER INSERT ON public.job_linkedin
    FOR EACH ROW EXECUTE FUNCTION deduct_credits_for_linkedin_post();

DROP TRIGGER IF EXISTS trigger_deduct_credits_job_alert_run ON public.job_alerts;
CREATE TRIGGER trigger_deduct_credits_job_alert_run
    AFTER UPDATE ON public.job_alerts
    FOR EACH ROW EXECUTE FUNCTION deduct_credits_for_job_alert_run();
