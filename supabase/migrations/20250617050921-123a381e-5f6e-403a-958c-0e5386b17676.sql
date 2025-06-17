
-- Create table to store generated LinkedIn post images
CREATE TABLE public.linkedin_post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  variation_number INTEGER NOT NULL,
  image_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, variation_number, created_at)
);

-- Add Row Level Security
ALTER TABLE public.linkedin_post_images ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view images for their posts
CREATE POLICY "Users can view images for their posts" 
  ON public.linkedin_post_images 
  FOR SELECT 
  USING (
    post_id IN (
      SELECT id FROM job_linkedin WHERE user_id = auth.uid()
    )
  );

-- Create policy for inserting images
CREATE POLICY "System can insert images" 
  ON public.linkedin_post_images 
  FOR INSERT 
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX idx_linkedin_post_images_post_variation ON public.linkedin_post_images(post_id, variation_number);
