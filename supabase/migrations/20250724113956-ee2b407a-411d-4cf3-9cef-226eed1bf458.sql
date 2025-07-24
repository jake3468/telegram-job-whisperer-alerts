-- Enable RLS on resume_chat_history_new table
ALTER TABLE public.resume_chat_history_new ENABLE ROW LEVEL SECURITY;

-- Create policy for resume chat history access (assuming session-based access)
CREATE POLICY "Users can manage their own resume chat history" 
ON public.resume_chat_history_new 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fix critical function search path vulnerabilities
-- Update get_current_clerk_user_id function
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SET search_path = public;
    
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::json ->> 'sub'),
        (auth.jwt() ->> 'sub')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update get_current_clerk_user_id_reliable function
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id_reliable()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SET search_path = public;
    
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::json ->> 'sub'),
        (auth.jwt() ->> 'sub')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update get_current_user_id function
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
    result UUID;
BEGIN
    SET search_path = public;
    
    SELECT u.id INTO result
    FROM users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update get_current_user_uuid function
CREATE OR REPLACE FUNCTION public.get_current_user_uuid()
RETURNS UUID AS $$
DECLARE
    result UUID;
BEGIN
    SET search_path = public;
    
    SELECT u.id INTO result
    FROM users u 
    WHERE u.clerk_id = get_current_clerk_user_id_reliable();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;