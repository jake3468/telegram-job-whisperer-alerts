
-- Step 1: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_linkedin_post_images_updated_at ON public.linkedin_post_images;

-- Step 2: Add the missing updated_at column to linkedin_post_images table (if not exists)
ALTER TABLE public.linkedin_post_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Step 3: Create trigger to automatically update the updated_at column
CREATE TRIGGER trigger_linkedin_post_images_updated_at
  BEFORE UPDATE ON public.linkedin_post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Clean up existing duplicate records - keep only the most recent one for each (post_id, variation_number) combination
WITH ranked_images AS (
  SELECT id, 
         post_id, 
         variation_number,
         ROW_NUMBER() OVER (
           PARTITION BY post_id, variation_number 
           ORDER BY created_at DESC, 
           CASE WHEN image_data != 'generating...' THEN 0 ELSE 1 END,
           id DESC
         ) as rn
  FROM public.linkedin_post_images
)
DELETE FROM public.linkedin_post_images 
WHERE id IN (
  SELECT id FROM ranked_images WHERE rn > 1
);

-- Step 5: Add unique constraint to prevent future duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_post_variation' 
        AND table_name = 'linkedin_post_images'
    ) THEN
        ALTER TABLE public.linkedin_post_images 
        ADD CONSTRAINT unique_post_variation 
        UNIQUE (post_id, variation_number);
    END IF;
END $$;
