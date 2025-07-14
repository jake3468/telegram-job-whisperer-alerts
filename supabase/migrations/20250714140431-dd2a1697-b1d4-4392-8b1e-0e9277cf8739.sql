-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own job tracker files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own job tracker files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own job tracker files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own job tracker files" ON storage.objects;

-- Create new storage policies that work with Clerk authentication
-- Since the bucket is now public, we'll make the policies more permissive for job tracker files
CREATE POLICY "Public access to job tracker files" 
ON storage.objects 
FOR ALL
USING (bucket_id = 'job-tracker-files')
WITH CHECK (bucket_id = 'job-tracker-files');