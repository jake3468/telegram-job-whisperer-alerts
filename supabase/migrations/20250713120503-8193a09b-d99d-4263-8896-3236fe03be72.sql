-- Create job_board table for storing job postings
CREATE TABLE public.job_board (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  via TEXT,
  thumbnail TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  salary TEXT,
  job_type TEXT,
  job_description TEXT,
  link_1_title TEXT,
  link_1_link TEXT,
  link_2_title TEXT,
  link_2_link TEXT,
  link_3_title TEXT,
  link_3_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_board ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own job board posts" 
ON public.job_board 
FOR SELECT 
USING (user_id IN ( 
  SELECT up.id
  FROM user_profile up
  JOIN users u ON u.id = up.user_id
  WHERE u.clerk_id = get_current_clerk_user_id()
));

CREATE POLICY "Service role can manage job board posts" 
ON public.job_board 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_job_board_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_board_updated_at
BEFORE UPDATE ON public.job_board
FOR EACH ROW
EXECUTE FUNCTION public.update_job_board_updated_at();

-- Create cleanup function for old job postings (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_job_board_data()
RETURNS TABLE(deleted_jobs integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_jobs_count integer := 0;
BEGIN
    -- Delete old job board posts
    DELETE FROM public.job_board 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_jobs_count = ROW_COUNT;
    
    -- Log the cleanup
    RAISE LOG 'Job board cleanup completed: % jobs deleted', 
        deleted_jobs_count;
    
    RETURN QUERY SELECT deleted_jobs_count;
END;
$$;