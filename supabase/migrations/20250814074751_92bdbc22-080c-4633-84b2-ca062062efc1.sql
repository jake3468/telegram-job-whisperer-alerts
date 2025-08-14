-- Remove temporary permissive policies
DROP POLICY IF EXISTS "temp_resume_upload_test" ON storage.objects;
DROP POLICY IF EXISTS "temp_resume_view_test" ON storage.objects;
DROP POLICY IF EXISTS "temp_resume_delete_test" ON storage.objects;

-- Create secure RLS policies that work with JWT authentication
-- Use auth.uid() and join with users table to validate ownership

CREATE POLICY "secure_resume_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  name ~ ('^user_' || (
    SELECT u.clerk_id 
    FROM users u 
    WHERE u.clerk_id = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'sub'),
      (auth.jwt() ->> 'sub')
    )
  ) || '/')
);

CREATE POLICY "secure_resume_view_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  name ~ ('^user_' || (
    SELECT u.clerk_id 
    FROM users u 
    WHERE u.clerk_id = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'sub'),
      (auth.jwt() ->> 'sub')
    )
  ) || '/')
);

CREATE POLICY "secure_resume_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  name ~ ('^user_' || (
    SELECT u.clerk_id 
    FROM users u 
    WHERE u.clerk_id = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'sub'),
      (auth.jwt() ->> 'sub')
    )
  ) || '/')
);