-- Fix storage bucket to be public for file access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'job-tracker-files';