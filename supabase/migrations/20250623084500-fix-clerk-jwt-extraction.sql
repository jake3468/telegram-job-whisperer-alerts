
-- Fix the get_current_clerk_user_id function to handle Clerk JWT properly
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- Try to get from request JWT claims first
    NULLIF(current_setting('request.jwt.claims', true)::json ->> 'sub', ''),
    -- Fallback to auth.jwt() if available
    NULLIF(auth.jwt() ->> 'sub', ''),
    -- Additional fallback for custom header format
    NULLIF(current_setting('request.headers', true)::json ->> 'clerk-user-id', '')
  );
$$;

-- Also create a debug function to help troubleshoot JWT issues
CREATE OR REPLACE FUNCTION public.debug_jwt_detailed()
RETURNS TABLE(
  method text,
  clerk_id text,
  jwt_full jsonb,
  current_settings jsonb,
  auth_jwt jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    'request.jwt.claims' as method,
    current_setting('request.jwt.claims', true)::json ->> 'sub' as clerk_id,
    current_setting('request.jwt.claims', true)::jsonb as jwt_full,
    to_jsonb(current_setting('request.jwt.claims', true)) as current_settings,
    auth.jwt() as auth_jwt
  UNION ALL
  SELECT 
    'auth.jwt()' as method,
    auth.jwt() ->> 'sub' as clerk_id,
    auth.jwt() as jwt_full,
    to_jsonb(current_setting('request.jwt.claims', true)) as current_settings,
    auth.jwt() as auth_jwt;
$$;
