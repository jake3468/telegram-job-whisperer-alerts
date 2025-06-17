
-- Create function to cleanup old LinkedIn data (60 days)
CREATE OR REPLACE FUNCTION cleanup_old_linkedin_data()
RETURNS TABLE(deleted_posts integer, deleted_images integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_posts_count integer := 0;
    deleted_images_count integer := 0;
BEGIN
    -- First delete old images (this will also delete orphaned images)
    DELETE FROM public.linkedin_post_images 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    GET DIAGNOSTICS deleted_images_count = ROW_COUNT;
    
    -- Then delete old LinkedIn posts
    DELETE FROM public.job_linkedin 
    WHERE created_at < NOW() - INTERVAL '60 days';
    
    GET DIAGNOSTICS deleted_posts_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'LinkedIn cleanup completed: % posts deleted, % images deleted', 
        deleted_posts_count, deleted_images_count;
    
    RETURN QUERY SELECT deleted_posts_count, deleted_images_count;
END;
$$;

-- Add foreign key constraint to ensure cascade deletion
ALTER TABLE public.linkedin_post_images 
ADD CONSTRAINT fk_linkedin_post_images_post_id 
FOREIGN KEY (post_id) REFERENCES public.job_linkedin(id) ON DELETE CASCADE;

-- Create indexes for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_job_linkedin_created_at ON public.job_linkedin(created_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_post_images_created_at ON public.linkedin_post_images(created_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_post_images_post_id ON public.linkedin_post_images(post_id);

-- Schedule the cleanup to run daily at 2 AM
SELECT cron.schedule(
    'linkedin-data-cleanup',
    '0 2 * * *', -- Daily at 2 AM
    $$SELECT public.cleanup_old_linkedin_data();$$
);
