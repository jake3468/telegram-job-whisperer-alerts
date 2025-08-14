-- Create a permissive policy that allows service role access
CREATE POLICY "service_role_bypass_resume" ON storage.objects
FOR ALL USING (
  bucket_id = 'resumes' AND (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated' OR
    auth.role() = 'anon'
  )
)
WITH CHECK (
  bucket_id = 'resumes' AND (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated' OR
    auth.role() = 'anon'
  )
);