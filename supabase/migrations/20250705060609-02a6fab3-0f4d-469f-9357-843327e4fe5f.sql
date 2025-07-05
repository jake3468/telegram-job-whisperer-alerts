-- Create blogs table for SEO-optimized blog system
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  author_name TEXT DEFAULT 'Aspirely Team',
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published blogs
CREATE POLICY "Anyone can view published blogs" 
ON public.blogs 
FOR SELECT 
USING (published = true);

-- Create policy for service role to manage all blogs
CREATE POLICY "Service role can manage all blogs" 
ON public.blogs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_blogs_published ON public.blogs(published, published_at DESC);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE INDEX idx_blogs_featured ON public.blogs(featured, published_at DESC) WHERE published = true;
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN(tags);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_blogs_updated_at();