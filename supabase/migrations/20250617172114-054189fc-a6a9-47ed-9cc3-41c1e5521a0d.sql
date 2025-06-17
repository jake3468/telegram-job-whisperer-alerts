
-- Remove the unique constraint on post_id to allow multiple images per post
ALTER TABLE public.linkedin_post_images DROP CONSTRAINT IF EXISTS unique_image_per_post;

-- Also remove any unique index on post_id if it exists
DROP INDEX IF EXISTS linkedin_post_images_post_id_key;
