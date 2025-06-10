
-- Drop existing policies and create completely permissive ones since we're using Clerk auth
DROP POLICY IF EXISTS "Users can view profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Users can create profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Users can delete profiles" ON public.user_profile;

-- Create policies that allow all operations without auth checks
-- We'll handle security in the application layer
CREATE POLICY "Allow all select operations" 
ON public.user_profile 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all insert operations" 
ON public.user_profile 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all update operations" 
ON public.user_profile 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all delete operations" 
ON public.user_profile 
FOR DELETE 
USING (true);
