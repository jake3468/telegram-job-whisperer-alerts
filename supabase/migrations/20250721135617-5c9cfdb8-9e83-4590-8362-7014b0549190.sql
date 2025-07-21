
-- Fix critical security issue: Enable RLS on resume_chat_history_new table
ALTER TABLE public.resume_chat_history_new ENABLE ROW LEVEL SECURITY;

-- Add user_id column to associate chat history with users
ALTER TABLE public.resume_chat_history_new ADD COLUMN user_id UUID REFERENCES public.users(id);

-- Create RLS policy to ensure users can only access their own chat history
CREATE POLICY "Users can view their own chat history" 
ON public.resume_chat_history_new 
FOR SELECT 
USING (user_id = get_current_user_uuid());

CREATE POLICY "Users can insert their own chat history" 
ON public.resume_chat_history_new 
FOR INSERT 
WITH CHECK (user_id = get_current_user_uuid());

CREATE POLICY "Users can update their own chat history" 
ON public.resume_chat_history_new 
FOR UPDATE 
USING (user_id = get_current_user_uuid());

CREATE POLICY "Users can delete their own chat history" 
ON public.resume_chat_history_new 
FOR DELETE 
USING (user_id = get_current_user_uuid());

-- Fix database function security by adding search_path to critical functions
-- This prevents SQL injection attacks through function calls

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $function$
  SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub';
$function$;

CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $function$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_uuid()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  clerk_user_id text;
  user_uuid uuid;
BEGIN
  -- Get the Clerk user ID from the JWT token
  BEGIN
    clerk_user_id := current_setting('request.jwt.claims', true)::json ->> 'sub';
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: try to get from auth.jwt() if available
    BEGIN
      clerk_user_id := auth.jwt() ->> 'sub';
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
  
  -- If we don't have a clerk_user_id, return NULL
  IF clerk_user_id IS NULL OR clerk_user_id = '' THEN
    RETURN NULL;
  END IF;
  
  -- Find the user in our users table
  SELECT id INTO user_uuid 
  FROM public.users 
  WHERE clerk_id = clerk_user_id;
  
  RETURN user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id_reliable()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $function$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'sub',
    auth.jwt() ->> 'sub'
  );
$function$;

-- Add security monitoring function to track suspicious activities
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_identifier text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.execution_logs (log_type, data)
  VALUES (
    'security_event',
    jsonb_build_object(
      'event_type', event_type,
      'user_identifier', user_identifier,
      'details', details,
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::json ->> 'x-forwarded-for'
    )
  );
END;
$function$;

-- Create a function to audit payment products access
CREATE OR REPLACE FUNCTION public.audit_payment_products_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log access to payment products for monitoring
  PERFORM public.log_security_event(
    'payment_products_access',
    COALESCE(auth.jwt() ->> 'sub', 'anonymous'),
    jsonb_build_object(
      'accessed_products', NEW.*,
      'user_agent', current_setting('request.headers', true)::json ->> 'user-agent'
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Add trigger to monitor payment products access
DROP TRIGGER IF EXISTS audit_payment_products_access_trigger ON public.payment_products;
CREATE TRIGGER audit_payment_products_access_trigger
  AFTER SELECT ON public.payment_products
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_products_access();
