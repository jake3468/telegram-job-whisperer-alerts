
-- Create a table to track image generation counts for LinkedIn posts
CREATE TABLE public.linkedin_post_image_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.job_linkedin(id) ON DELETE CASCADE,
  variation_number INTEGER NOT NULL CHECK (variation_number >= 1 AND variation_number <= 3),
  image_count INTEGER NOT NULL DEFAULT 0 CHECK (image_count >= 0 AND image_count <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, variation_number)
);

-- Enable RLS
ALTER TABLE public.linkedin_post_image_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_post_image_counts
CREATE POLICY "Users can view their own post image counts"
  ON public.linkedin_post_image_counts
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.job_linkedin 
      WHERE user_id IN (
        SELECT id FROM public.user_profile 
        WHERE user_id = get_current_user_id_from_clerk()
      )
    )
  );

CREATE POLICY "Users can insert their own post image counts"
  ON public.linkedin_post_image_counts
  FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM public.job_linkedin 
      WHERE user_id IN (
        SELECT id FROM public.user_profile 
        WHERE user_id = get_current_user_id_from_clerk()
      )
    )
  );

CREATE POLICY "Users can update their own post image counts"
  ON public.linkedin_post_image_counts
  FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM public.job_linkedin 
      WHERE user_id IN (
        SELECT id FROM public.user_profile 
        WHERE user_id = get_current_user_id_from_clerk()
      )
    )
  );

-- Create a function to update image counts when images are added
CREATE OR REPLACE FUNCTION public.update_linkedin_image_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the count for this post variation
  INSERT INTO public.linkedin_post_image_counts (post_id, variation_number, image_count)
  VALUES (
    NEW.post_id, 
    NEW.variation_number,
    1
  )
  ON CONFLICT (post_id, variation_number)
  DO UPDATE SET 
    image_count = linkedin_post_image_counts.image_count + 1,
    updated_at = now()
  WHERE linkedin_post_image_counts.image_count < 3;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update counts when images are inserted
CREATE TRIGGER trigger_update_linkedin_image_count
  AFTER INSERT ON public.linkedin_post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_linkedin_image_count();

-- Create an updated_at trigger for the counts table
CREATE TRIGGER trigger_linkedin_post_image_counts_updated_at
  BEFORE UPDATE ON public.linkedin_post_image_counts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
