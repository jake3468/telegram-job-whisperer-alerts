
-- Add user_id column to linkedin_post_image_counts for direct user ownership
ALTER TABLE public.linkedin_post_image_counts 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add user_id column to linkedin_post_images for direct user ownership  
ALTER TABLE public.linkedin_post_images 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Populate existing records with user_id from the post ownership chain
UPDATE public.linkedin_post_image_counts 
SET user_id = (
    SELECT u.id 
    FROM public.job_linkedin jl 
    JOIN public.user_profile up ON jl.user_id = up.id 
    JOIN public.users u ON u.id = up.user_id 
    WHERE jl.id = linkedin_post_image_counts.post_id
);

UPDATE public.linkedin_post_images 
SET user_id = (
    SELECT u.id 
    FROM public.job_linkedin jl 
    JOIN public.user_profile up ON jl.user_id = up.id 
    JOIN public.users u ON u.id = up.user_id 
    WHERE jl.id = linkedin_post_images.post_id
);

-- Drop all existing complex RLS policies
DROP POLICY IF EXISTS "Users can view image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can view images for their posts" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert images for their posts" ON public.linkedin_post_images;

-- Drop any other potential policy names that might exist
DROP POLICY IF EXISTS "Users can view their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can view their own images" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.linkedin_post_images;

-- Enable RLS if not already enabled
ALTER TABLE public.linkedin_post_image_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_post_images ENABLE ROW LEVEL SECURITY;

-- Create new policies for linkedin_post_image_counts
CREATE POLICY "Users can view image counts for their posts" ON public.linkedin_post_image_counts
    FOR SELECT 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can insert image counts for their posts" ON public.linkedin_post_image_counts
    FOR INSERT 
    WITH CHECK (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can update image counts for their posts" ON public.linkedin_post_image_counts
    FOR UPDATE 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Create new policies for linkedin_post_images
CREATE POLICY "Users can view images for their posts" ON public.linkedin_post_images
    FOR SELECT 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can insert images for their posts" ON public.linkedin_post_images
    FOR INSERT 
    WITH CHECK (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Update the trigger function to respect the 3-image limit and set user_id
CREATE OR REPLACE FUNCTION public.update_linkedin_image_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    post_user_id UUID;
BEGIN
  -- Get the user_id from the post
  SELECT u.id INTO post_user_id
  FROM public.job_linkedin jl 
  JOIN public.user_profile up ON jl.user_id = up.id 
  JOIN public.users u ON u.id = up.user_id 
  WHERE jl.id = NEW.post_id;
  
  -- Set the user_id on the new image record
  NEW.user_id = post_user_id;
  
  -- Check current count for this post variation
  SELECT COALESCE(image_count, 0) INTO current_count
  FROM public.linkedin_post_image_counts
  WHERE post_id = NEW.post_id AND variation_number = NEW.variation_number;
  
  -- Only proceed if we haven't reached the limit of 3
  IF current_count < 3 THEN
    -- Insert or update the count for this post variation
    INSERT INTO public.linkedin_post_image_counts (post_id, variation_number, image_count, user_id)
    VALUES (
      NEW.post_id, 
      NEW.variation_number,
      1,
      post_user_id
    )
    ON CONFLICT (post_id, variation_number)
    DO UPDATE SET 
      image_count = LEAST(linkedin_post_image_counts.image_count + 1, 3),
      updated_at = now()
    WHERE linkedin_post_image_counts.image_count < 3;
  END IF;
  
  RETURN NEW;
END;
$$;
