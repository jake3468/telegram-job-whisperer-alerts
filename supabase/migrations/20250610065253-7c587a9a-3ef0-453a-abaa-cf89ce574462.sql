
-- Enable RLS on user_profile table if not already enabled
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profile 
FOR SELECT 
USING (user_id = public.get_current_user_uuid());

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can create their own profile" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (user_id = public.get_current_user_uuid());

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profile 
FOR UPDATE 
USING (user_id = public.get_current_user_uuid());

-- Create policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.user_profile 
FOR DELETE 
USING (user_id = public.get_current_user_uuid());
