
-- Drop the existing function first, then recreate it with the correct return type
DROP FUNCTION IF EXISTS public.debug_user_auth();

CREATE OR REPLACE FUNCTION public.debug_user_auth()
RETURNS TABLE(
  clerk_id text,
  jwt_sub text,
  jwt_issuer text,
  jwt_aud text,
  current_setting_claims text,
  auth_role text,
  user_exists boolean,
  user_id_found uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    public.get_current_clerk_user_id() as clerk_id,
    auth.jwt() ->> 'sub' as jwt_sub,
    auth.jwt() ->> 'iss' as jwt_issuer,
    auth.jwt() ->> 'aud' as jwt_aud,
    current_setting('request.jwt.claims', true) as current_setting_claims,
    auth.role() as auth_role,
    EXISTS(SELECT 1 FROM public.users WHERE clerk_id = public.get_current_clerk_user_id()) as user_exists,
    (SELECT id FROM public.users WHERE clerk_id = public.get_current_clerk_user_id() LIMIT 1) as user_id_found;
$$;
