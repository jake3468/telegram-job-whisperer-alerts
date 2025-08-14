-- Create the most permissive policy possible for debugging
DROP POLICY IF EXISTS "resume_upload_policy_simple" ON storage.objects;
DROP POLICY IF EXISTS "resume_view_policy_simple" ON storage.objects;
DROP POLICY IF EXISTS "resume_delete_policy_simple" ON storage.objects;

-- Temporarily allow all operations on resumes bucket
CREATE POLICY "allow_all_resume_operations" ON storage.objects
FOR ALL USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');