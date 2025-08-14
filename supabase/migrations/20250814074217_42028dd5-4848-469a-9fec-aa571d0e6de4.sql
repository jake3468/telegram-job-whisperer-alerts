-- Clean up all existing resume storage policies to prevent conflicts
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Temp test policy for resumes" ON storage.objects;

-- Create proper RLS policies for the user_{clerk_id} path pattern
CREATE POLICY "resume_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND
  name ~ ('^user_' || public.get_current_clerk_user_id() || '/')
);

CREATE POLICY "resume_view_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND
  name ~ ('^user_' || public.get_current_clerk_user_id() || '/')
);

CREATE POLICY "resume_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND
  name ~ ('^user_' || public.get_current_clerk_user_id() || '/')
);