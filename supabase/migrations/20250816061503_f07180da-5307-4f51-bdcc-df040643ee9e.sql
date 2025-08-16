-- Create add_job_telegram table
CREATE TABLE public.add_job_telegram (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  job_location TEXT NOT NULL,
  country_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.add_job_telegram ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own add job telegram entries" 
ON public.add_job_telegram 
FOR SELECT 
USING (user_id IN (
  SELECT up.id 
  FROM user_profile up 
  JOIN users u ON u.id = up.user_id 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can create their own add job telegram entries" 
ON public.add_job_telegram 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT up.id 
  FROM user_profile up 
  JOIN users u ON u.id = up.user_id 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can update their own add job telegram entries" 
ON public.add_job_telegram 
FOR UPDATE 
USING (user_id IN (
  SELECT up.id 
  FROM user_profile up 
  JOIN users u ON u.id = up.user_id 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
))
WITH CHECK (user_id IN (
  SELECT up.id 
  FROM user_profile up 
  JOIN users u ON u.id = up.user_id 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can delete their own add job telegram entries" 
ON public.add_job_telegram 
FOR DELETE 
USING (user_id IN (
  SELECT up.id 
  FROM user_profile up 
  JOIN users u ON u.id = up.user_id 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

-- Service role bypass policy
CREATE POLICY "Service role can manage add job telegram entries" 
ON public.add_job_telegram 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_add_job_telegram_updated_at
BEFORE UPDATE ON public.add_job_telegram
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();