-- Create grace_interview_requests table for AI mock interview feature
CREATE TABLE public.grace_interview_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profile(id) NULL,
  phone_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable Row Level Security
ALTER TABLE public.grace_interview_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create their own interview requests" 
  ON public.grace_interview_requests 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

-- Allow users to view their own requests
CREATE POLICY "Users can view their own interview requests" 
  ON public.grace_interview_requests 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.user_profile WHERE user_id = get_current_user_id()));

-- Service role can manage all requests
CREATE POLICY "Service role can manage all interview requests" 
  ON public.grace_interview_requests 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_grace_interview_requests_updated_at
  BEFORE UPDATE ON public.grace_interview_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();