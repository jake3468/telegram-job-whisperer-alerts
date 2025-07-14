-- Add new columns to job_board table for improved job tracking
ALTER TABLE public.job_board 
ADD COLUMN IF NOT EXISTS job_reference_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_saved_by_user BOOLEAN DEFAULT false;

-- Create index on job_reference_id for better performance
CREATE INDEX IF NOT EXISTS idx_job_board_job_reference_id ON public.job_board(job_reference_id);

-- Create index on is_saved_by_user for better filtering performance
CREATE INDEX IF NOT EXISTS idx_job_board_is_saved_by_user ON public.job_board(is_saved_by_user);

-- Update RLS policies to include new columns
-- Update existing policy to allow users to update is_saved_by_user
DROP POLICY IF EXISTS "Users can update saved status on job board posts" ON public.job_board;
CREATE POLICY "Users can update saved status on job board posts" 
ON public.job_board 
FOR UPDATE 
USING (user_id IN ( SELECT up.id
   FROM (user_profile up
     JOIN users u ON ((u.id = up.user_id)))
  WHERE (u.clerk_id = get_current_clerk_user_id())))
WITH CHECK (user_id IN ( SELECT up.id
   FROM (user_profile up
     JOIN users u ON ((u.id = up.user_id)))
  WHERE (u.clerk_id = get_current_clerk_user_id())));

-- Ensure job_reference_id is unique per job posting
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_board_unique_reference ON public.job_board(job_reference_id);