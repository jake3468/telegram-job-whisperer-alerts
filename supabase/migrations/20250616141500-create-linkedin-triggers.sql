
-- Create the trigger for LinkedIn webhook
CREATE TRIGGER trigger_linkedin_webhook
    AFTER INSERT ON public.job_linkedin
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_linkedin_webhook();

-- Create the trigger for credit deduction on LinkedIn posts
CREATE TRIGGER trigger_deduct_credits_linkedin_post
    AFTER INSERT ON public.job_linkedin
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_credits_for_linkedin_post();
