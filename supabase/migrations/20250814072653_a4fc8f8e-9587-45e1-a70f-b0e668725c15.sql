-- Fix the RLS policy for resume uploads
-- The current policy is checking the file path against users table, but we need to use the authenticated user's clerk_id

-- Drop existing INSERT policy for resumes
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;

-- Create new INSERT policy that properly uses the authenticated user's clerk_id
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = public.get_current_clerk_user_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.clerk_id = public.get_current_clerk_user_id()
  )
);