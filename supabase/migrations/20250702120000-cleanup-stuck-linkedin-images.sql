
-- Clean up stuck 'generating...' records that are older than 10 minutes
DELETE FROM public.linkedin_post_images 
WHERE image_data = 'generating...' 
AND created_at < NOW() - INTERVAL '10 minutes';

-- Add a function to automatically clean up stuck records
CREATE OR REPLACE FUNCTION public.cleanup_stuck_linkedin_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.linkedin_post_images 
    WHERE image_data = 'generating...' 
    AND created_at < NOW() - INTERVAL '10 minutes';
    
    RAISE LOG 'Cleaned up stuck LinkedIn image generation records';
END;
$$;
