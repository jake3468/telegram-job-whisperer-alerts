-- Temporarily disable RLS policies to test upload
DROP POLICY IF EXISTS "resume_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "resume_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "resume_delete_policy" ON storage.objects;

-- Create a temporary permissive policy to test upload
CREATE POLICY "temp_resume_upload_test" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "temp_resume_view_test" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "temp_resume_delete_test" ON storage.objects
FOR DELETE USING (bucket_id = 'resumes');