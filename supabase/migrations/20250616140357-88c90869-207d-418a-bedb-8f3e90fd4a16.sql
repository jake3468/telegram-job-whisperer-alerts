
-- Remove the current linkedin_post column and add 6 new columns for 3 post variations
ALTER TABLE public.job_linkedin 
DROP COLUMN IF EXISTS linkedin_post;

-- Add 6 new columns for 3 post variations with headings and content
ALTER TABLE public.job_linkedin 
ADD COLUMN post_heading_1 text,
ADD COLUMN post_content_1 text,
ADD COLUMN post_heading_2 text,
ADD COLUMN post_content_2 text,
ADD COLUMN post_heading_3 text,
ADD COLUMN post_content_3 text;
