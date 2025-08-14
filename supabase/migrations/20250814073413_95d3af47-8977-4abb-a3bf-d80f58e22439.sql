-- Remove the temporary test policy
DROP POLICY IF EXISTS "Temp test policy for resumes" ON storage.objects;

-- Create the proper secure policies
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);

CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);

CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = public.get_current_clerk_user_id()
);