
-- Create a table for LinkedIn posts
CREATE TABLE public.job_linkedin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profile(id) NOT NULL,
  topic TEXT NOT NULL,
  opinion TEXT,
  personal_story TEXT,
  audience TEXT,
  tone TEXT,
  linkedin_post TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.job_linkedin ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own LinkedIn posts" 
  ON public.job_linkedin 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can create their own LinkedIn posts" 
  ON public.job_linkedin 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can update their own LinkedIn posts" 
  ON public.job_linkedin 
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can delete their own LinkedIn posts" 
  ON public.job_linkedin 
  FOR DELETE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

-- Add trigger for updated_at
CREATE TRIGGER update_job_linkedin_updated_at
  BEFORE UPDATE ON public.job_linkedin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
