-- Create a storage bucket for website assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true);

-- Create RLS policies for the assets bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Allow authenticated users to upload assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.role() = 'authenticated');