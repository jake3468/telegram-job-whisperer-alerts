
-- First, let's clean up duplicate images by keeping only the most recent one per post_id
WITH ranked_images AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) as rn
  FROM public.linkedin_post_images
)
DELETE FROM public.linkedin_post_images 
WHERE id IN (
  SELECT id FROM ranked_images WHERE rn > 1
);

-- Remove the linkedin_post_image_counts table as it's no longer needed
DROP TABLE IF EXISTS public.linkedin_post_image_counts CASCADE;

-- Drop the trigger function that was updating the counts table
DROP FUNCTION IF EXISTS public.update_linkedin_image_count() CASCADE;

-- Drop the trigger that was calling the function
DROP TRIGGER IF EXISTS trigger_update_linkedin_image_count ON public.linkedin_post_images;

-- Update the linkedin_post_images table to remove variation_number since we now have one image per post
ALTER TABLE public.linkedin_post_images DROP COLUMN IF EXISTS variation_number;

-- Create a unique constraint to ensure only one image per post
ALTER TABLE public.linkedin_post_images ADD CONSTRAINT unique_image_per_post UNIQUE (post_id);

-- Create a simple updated_at trigger for linkedin_post_images
CREATE TRIGGER trigger_linkedin_post_images_updated_at
  BEFORE UPDATE ON public.linkedin_post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
