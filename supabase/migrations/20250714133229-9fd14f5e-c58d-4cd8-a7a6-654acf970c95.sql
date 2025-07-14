-- Add comments and file_urls columns to job_tracker table
ALTER TABLE public.job_tracker 
ADD COLUMN comments text,
ADD COLUMN file_urls jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for job tracker files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-tracker-files', 'job-tracker-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for job tracker files
CREATE POLICY "Users can upload their own job tracker files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'job-tracker-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own job tracker files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-tracker-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own job tracker files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'job-tracker-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job tracker files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'job-tracker-files' AND auth.uid()::text = (storage.foldername(name))[1]);