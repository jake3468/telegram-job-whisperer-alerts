-- Create a temporary permissive policy for testing
DROP POLICY IF EXISTS "Temp test policy for resumes" ON storage.objects;
CREATE POLICY "Temp test policy for resumes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- This is just for testing - we'll fix it properly after