-- Create storage bucket for animations and assets
INSERT INTO storage.buckets (id, name, public) VALUES ('animations', 'animations', true);

-- Create policies for public access to animations
CREATE POLICY "Animations are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'animations');

CREATE POLICY "Anyone can upload animations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'animations');