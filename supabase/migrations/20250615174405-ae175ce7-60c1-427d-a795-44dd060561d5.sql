
-- Diagnostic and repair queries for user profile and credits linkage

-- 1. First, let's check what get_current_user_id_from_clerk() returns for debugging
SELECT 
  'Current Clerk User ID from function' as check_type,
  public.get_current_user_id_from_clerk() as result;

-- 2. Check if there are users without user_profiles
SELECT 
  'Users without profiles' as check_type,
  u.id as user_id,
  u.clerk_id,
  u.email
FROM public.users u
LEFT JOIN public.user_profile up ON u.id = up.user_id
WHERE up.id IS NULL;

-- 3. Check if there are user_profiles without user_credits
SELECT 
  'Profiles without credits' as check_type,
  up.id as profile_id,
  up.user_id,
  u.email
FROM public.user_profile up
JOIN public.users u ON up.user_id = u.id
LEFT JOIN public.user_credits uc ON up.id = uc.user_profile_id
WHERE uc.id IS NULL;

-- 4. Check for orphaned user_credits (credits without valid user_profile)
SELECT 
  'Orphaned credits' as check_type,
  uc.id as credit_id,
  uc.user_profile_id,
  uc.current_balance
FROM public.user_credits uc
LEFT JOIN public.user_profile up ON uc.user_profile_id = up.id
WHERE up.id IS NULL;

-- 5. Now let's fix the issues by creating missing profiles and credits
-- Create missing user_profiles for users who don't have them
INSERT INTO public.user_profile (user_id, bio, resume, bot_activated, chat_id)
SELECT 
  u.id,
  NULL,
  NULL,
  false,
  NULL
FROM public.users u
LEFT JOIN public.user_profile up ON u.id = up.user_id
WHERE up.id IS NULL;

-- 6. Initialize credits for user_profiles that don't have them
-- This uses the existing initialize_user_credits function
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT up.id as profile_id
    FROM public.user_profile up
    LEFT JOIN public.user_credits uc ON up.id = uc.user_profile_id
    WHERE uc.id IS NULL
  LOOP
    PERFORM public.initialize_user_credits(profile_record.profile_id);
  END LOOP;
END $$;

-- 7. Finally, let's verify the repairs worked
SELECT 
  'Verification - User chain' as check_type,
  u.clerk_id,
  u.email,
  up.id as profile_id,
  uc.current_balance
FROM public.users u
JOIN public.user_profile up ON u.id = up.user_id
JOIN public.user_credits uc ON up.id = uc.user_profile_id
ORDER BY u.created_at DESC
LIMIT 10;
