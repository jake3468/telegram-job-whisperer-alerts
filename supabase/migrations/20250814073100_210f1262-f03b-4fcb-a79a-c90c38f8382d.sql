-- Temporarily drop the current policy
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;

-- Create a simplified policy for testing
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);

-- Also ensure we have proper SELECT policy for the resumes bucket
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);

-- And DELETE policy
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);