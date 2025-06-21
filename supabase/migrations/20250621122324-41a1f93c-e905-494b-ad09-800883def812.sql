
-- Let's try a simpler approach to avoid deadlocks
-- First, just drop the existing policies
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.interview_prep;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.interview_prep;  
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.interview_prep;
DROP POLICY IF EXISTS "Enable webhook updates" ON public.interview_prep;
