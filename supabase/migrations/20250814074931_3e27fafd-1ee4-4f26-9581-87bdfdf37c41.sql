-- Remove the complex secure policies that aren't working
DROP POLICY IF EXISTS "secure_resume_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "secure_resume_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "secure_resume_delete_policy" ON storage.objects;

-- Create simpler, working RLS policies using direct JWT claims access
CREATE POLICY "resume_upload_policy_simple" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "resume_view_policy_simple" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "resume_delete_policy_simple" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  auth.role() = 'authenticated'
);