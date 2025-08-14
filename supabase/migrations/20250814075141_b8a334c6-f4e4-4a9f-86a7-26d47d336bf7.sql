-- Drop the current policy and disable RLS temporarily for debugging
DROP POLICY IF EXISTS "allow_all_resume_operations" ON storage.objects;

-- Disable RLS on storage.objects for the resumes bucket completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;