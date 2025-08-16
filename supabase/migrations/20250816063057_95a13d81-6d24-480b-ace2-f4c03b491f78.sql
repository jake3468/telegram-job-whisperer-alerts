-- First add user_id column to add_job_chat_history_new table
ALTER TABLE public.add_job_chat_history_new 
ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.add_job_chat_history_new ENABLE ROW LEVEL SECURITY;

-- Create policies matching resume_chat_history_new table
CREATE POLICY "Service role can manage add job chat history" 
ON public.add_job_chat_history_new 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own add job chat history" 
ON public.add_job_chat_history_new 
FOR SELECT 
USING (user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can insert their own add job chat history" 
ON public.add_job_chat_history_new 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can update their own add job chat history" 
ON public.add_job_chat_history_new 
FOR UPDATE 
USING (user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
))
WITH CHECK (user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));

CREATE POLICY "Users can delete their own add job chat history" 
ON public.add_job_chat_history_new 
FOR DELETE 
USING (user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable()
));