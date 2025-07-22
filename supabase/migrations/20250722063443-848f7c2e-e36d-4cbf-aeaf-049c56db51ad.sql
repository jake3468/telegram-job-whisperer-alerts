
-- Add resume filename and upload timestamp to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN resume_filename TEXT,
ADD COLUMN resume_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on resume queries
CREATE INDEX IF NOT EXISTS idx_user_profile_resume_uploaded_at 
ON public.user_profile(resume_uploaded_at);

-- Update RLS policies to allow users to update their resume filename
-- (The existing policies should already cover this, but ensuring completeness)
