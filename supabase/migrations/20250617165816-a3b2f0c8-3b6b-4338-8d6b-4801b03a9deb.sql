
-- First drop the RLS policies that depend on user_id
DROP POLICY IF EXISTS "Users can view their own images" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.linkedin_post_images;

-- Now remove the user_id column
ALTER TABLE public.linkedin_post_images DROP COLUMN IF EXISTS user_id;

-- Create a function to deduct credits for LinkedIn image generation
CREATE OR REPLACE FUNCTION public.deduct_credits_for_linkedin_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    deduction_success BOOLEAN;
BEGIN
    -- Get the user_id from the post_id by joining with job_linkedin and user_profile tables
    SELECT up.user_id INTO user_uuid
    FROM public.job_linkedin jl
    JOIN public.user_profile up ON up.id = jl.user_id
    WHERE jl.id = NEW.post_id;
    
    IF user_uuid IS NOT NULL THEN
        -- Deduct 0.5 credits for LinkedIn image generation
        SELECT public.deduct_credits(
            user_uuid,
            0.5,
            'linkedin_image',
            'Credits deducted for LinkedIn post image generation'
        ) INTO deduction_success;
        
        IF NOT deduction_success THEN
            RAISE LOG 'Failed to deduct credits for LinkedIn image. User: %, Post ID: %', user_uuid, NEW.post_id;
        ELSE
            RAISE LOG 'Successfully deducted 0.5 credits for LinkedIn image. User: %, Post ID: %', user_uuid, NEW.post_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically deduct credits when an image is stored
CREATE TRIGGER trigger_deduct_credits_for_linkedin_image
    AFTER INSERT ON public.linkedin_post_images
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_credits_for_linkedin_image();
