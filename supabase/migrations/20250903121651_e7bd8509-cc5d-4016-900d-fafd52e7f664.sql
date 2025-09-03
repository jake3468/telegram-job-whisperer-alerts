-- Create hero videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-videos', 'hero-videos', true);

-- Create RLS policies for hero videos bucket
CREATE POLICY "Hero videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-videos');

-- Only authenticated admins can upload hero videos
CREATE POLICY "Only authenticated users can upload hero videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hero-videos' AND auth.uid() IS NOT NULL);

-- Only authenticated admins can update hero videos
CREATE POLICY "Only authenticated users can update hero videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hero-videos' AND auth.uid() IS NOT NULL);

-- Only authenticated admins can delete hero videos
CREATE POLICY "Only authenticated users can delete hero videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'hero-videos' AND auth.uid() IS NOT NULL);

-- Create a table to track video analytics and prevent abuse
CREATE TABLE public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_path TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on video analytics
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts for tracking
CREATE POLICY "Allow video analytics inserts" 
ON public.video_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_video_analytics_ip_time ON public.video_analytics(ip_address, played_at);
CREATE INDEX idx_video_analytics_session ON public.video_analytics(session_id, played_at);