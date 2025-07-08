-- Create enum for job tracker status
CREATE TYPE public.job_status AS ENUM ('saved', 'applied', 'interview', 'rejected', 'offer');

-- Create job_tracker table
CREATE TABLE public.job_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profile(id) NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  job_url TEXT,
  status public.job_status NOT NULL DEFAULT 'saved',
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own job tracker entries" 
  ON public.job_tracker 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can create their own job tracker entries" 
  ON public.job_tracker 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can update their own job tracker entries" 
  ON public.job_tracker 
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

CREATE POLICY "Users can delete their own job tracker entries" 
  ON public.job_tracker 
  FOR DELETE 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

-- Service role bypass RLS
CREATE POLICY "Service role can manage job_tracker" 
  ON public.job_tracker 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_job_tracker_updated_at
  BEFORE UPDATE ON public.job_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();