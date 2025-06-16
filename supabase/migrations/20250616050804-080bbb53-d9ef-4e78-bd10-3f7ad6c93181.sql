
-- Advanced diagnostic and repair for RLS credit issues

-- 1. Check the current Clerk user ID and corresponding database records
WITH current_session AS (
  SELECT public.get_current_user_id_from_clerk() as current_user_id
),
clerk_debug AS (
  SELECT 
    COALESCE(
      current_setting('request.jwt.claims', true)::json ->> 'sub',
      auth.jwt() ->> 'sub'
    ) as clerk_id_from_token
)
SELECT 
  'Debug Current Session' as check_type,
  cs.current_user_id,
  cd.clerk_id_from_token,
  u.id as user_table_id,
  u.clerk_id as user_table_clerk_id,
  u.email,
  up.id as profile_id,
  uc.id as credits_id,
  uc.current_balance
FROM current_session cs
CROSS JOIN clerk_debug cd
LEFT JOIN public.users u ON u.id = cs.current_user_id
LEFT JOIN public.user_profile up ON up.user_id = u.id  
LEFT JOIN public.user_credits uc ON uc.user_profile_id = up.id;

-- 2. Find any mismatched or duplicate records
SELECT 
  'Potential Issues' as check_type,
  u.id as user_id,
  u.clerk_id,
  u.email,
  COUNT(up.id) as profile_count,
  COUNT(uc.id) as credits_count
FROM public.users u
LEFT JOIN public.user_profile up ON up.user_id = u.id
LEFT JOIN public.user_credits uc ON uc.user_profile_id = up.id
GROUP BY u.id, u.clerk_id, u.email
HAVING COUNT(up.id) != 1 OR COUNT(uc.id) != 1;

-- 3. Check if there are user_credits records with NULL user_profile_id
SELECT 
  'Credits with NULL profile_id' as check_type,
  uc.*
FROM public.user_credits uc
WHERE uc.user_profile_id IS NULL;

-- 4. Delete any orphaned user_credits records (those without valid user_profile)
DELETE FROM public.user_credits 
WHERE user_profile_id NOT IN (SELECT id FROM public.user_profile WHERE id IS NOT NULL);

-- 5. Ensure every user has exactly one profile
INSERT INTO public.user_profile (user_id, bio, resume, bot_activated, chat_id)
SELECT DISTINCT
  u.id,
  NULL,
  NULL,
  false,
  NULL
FROM public.users u
WHERE u.id NOT IN (SELECT DISTINCT user_id FROM public.user_profile WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- 6. Ensure every profile has exactly one credits record
INSERT INTO public.user_credits (user_profile_id, current_balance, free_credits, paid_credits, subscription_plan, next_reset_date)
SELECT 
  up.id,
  15,
  15,
  0,
  'free',
  NOW() + INTERVAL '30 days'
FROM public.user_profile up
WHERE up.id NOT IN (SELECT DISTINCT user_profile_id FROM public.user_credits WHERE user_profile_id IS NOT NULL)
ON CONFLICT (user_profile_id) DO NOTHING;

-- 7. Final verification - show the complete user chain
SELECT 
  'Final Verification' as check_type,
  u.clerk_id,
  u.email,
  u.id as user_id,
  up.id as profile_id,
  uc.id as credits_id,
  uc.current_balance,
  uc.user_profile_id
FROM public.users u
JOIN public.user_profile up ON up.user_id = u.id
JOIN public.user_credits uc ON uc.user_profile_id = up.id
ORDER BY u.created_at DESC;
