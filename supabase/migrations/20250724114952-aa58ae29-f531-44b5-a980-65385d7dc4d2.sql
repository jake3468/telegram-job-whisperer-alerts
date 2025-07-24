-- Revert database functions to restore Supabase connectivity
-- The auth.jwt() function requires access to the auth schema

-- Revert get_current_clerk_user_id function
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth
AS $function$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'sub'),
    (auth.jwt() ->> 'sub')
  );
$function$;

-- Revert get_current_clerk_user_id_reliable function
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id_reliable()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth
AS $function$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'sub'),
    (auth.jwt() ->> 'sub')
  );
$function$;

-- Revert get_current_user_id function
CREATE OR REPLACE FUNCTION public.get_current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth
AS $function$
  SELECT u.id
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable();
$function$;

-- Revert get_current_user_uuid function
CREATE OR REPLACE FUNCTION public.get_current_user_uuid()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public, auth
AS $function$
  SELECT u.id
  FROM users u 
  WHERE u.clerk_id = get_current_clerk_user_id_reliable();
$function$;