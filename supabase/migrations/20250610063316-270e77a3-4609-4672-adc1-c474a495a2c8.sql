
-- Phase 1: Drop dependent RLS policies first
DROP POLICY IF EXISTS "Users can view their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can insert their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can update their own job analyses" ON public.job_analyses;
DROP POLICY IF EXISTS "Users can delete their own job analyses" ON public.job_analyses;

DROP POLICY IF EXISTS "Users can view their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can insert their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update their own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete their own job alerts" ON public.job_alerts;

DROP POLICY IF EXISTS "Users can view their own job cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can insert their own job cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can update their own job cover letters" ON public.job_cover_letters;
DROP POLICY IF EXISTS "Users can delete their own job cover letters" ON public.job_cover_letters;

-- Phase 2: Data Migration & Schema Updates

-- Step 1: Ensure all users have a user_profile record and migrate data
INSERT INTO public.user_profile (user_id, bio, chat_id, bot_activated, bot_id)
SELECT 
    u.id as user_id,
    u.bio,
    u.chat_id::text, -- Convert bigint to text
    COALESCE(u.activated, false) as bot_activated,
    u.bot_id
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profile up WHERE up.user_id = u.id
);

-- Step 2: Update existing user_profile records with data from users table
UPDATE public.user_profile 
SET 
    bio = COALESCE(user_profile.bio, u.bio),
    chat_id = COALESCE(user_profile.chat_id, u.chat_id::text),
    bot_activated = COALESCE(user_profile.bot_activated, u.activated, false),
    bot_id = COALESCE(user_profile.bot_id, u.bot_id)
FROM public.users u
WHERE user_profile.user_id = u.id;

-- Phase 3: Foreign Key Restructuring

-- Step 3: Create temporary columns to store new foreign key references
ALTER TABLE public.job_analyses ADD COLUMN new_user_id uuid;
ALTER TABLE public.job_alerts ADD COLUMN new_user_id uuid;
ALTER TABLE public.job_cover_letters ADD COLUMN new_user_id uuid;

-- Step 4: Populate new foreign key columns with user_profile.id
UPDATE public.job_analyses 
SET new_user_id = up.id
FROM public.user_profile up
WHERE job_analyses.user_id = up.user_id;

UPDATE public.job_alerts 
SET new_user_id = up.id
FROM public.user_profile up
WHERE job_alerts.user_id = up.user_id;

UPDATE public.job_cover_letters 
SET new_user_id = up.id
FROM public.user_profile up
WHERE job_cover_letters.user_id = up.user_id;

-- Step 5: Drop old foreign key constraints and columns
ALTER TABLE public.job_analyses DROP CONSTRAINT IF EXISTS job_analyses_user_id_fkey;
ALTER TABLE public.job_alerts DROP CONSTRAINT IF EXISTS job_alerts_user_id_fkey;
ALTER TABLE public.job_cover_letters DROP CONSTRAINT IF EXISTS job_cover_letters_user_id_fkey;

ALTER TABLE public.job_analyses DROP COLUMN user_id;
ALTER TABLE public.job_alerts DROP COLUMN user_id;
ALTER TABLE public.job_cover_letters DROP COLUMN user_id;

-- Step 6: Rename new columns to user_id and add foreign key constraints
ALTER TABLE public.job_analyses RENAME COLUMN new_user_id TO user_id;
ALTER TABLE public.job_alerts RENAME COLUMN new_user_id TO user_id;
ALTER TABLE public.job_cover_letters RENAME COLUMN new_user_id TO user_id;

-- Make user_id columns NOT NULL
ALTER TABLE public.job_analyses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.job_alerts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.job_cover_letters ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraints pointing to user_profile.id
ALTER TABLE public.job_analyses 
ADD CONSTRAINT job_analyses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;

ALTER TABLE public.job_alerts 
ADD CONSTRAINT job_alerts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;

ALTER TABLE public.job_cover_letters 
ADD CONSTRAINT job_cover_letters_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;

-- Step 7: Drop columns from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS bio;
ALTER TABLE public.users DROP COLUMN IF EXISTS chat_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS activated;
ALTER TABLE public.users DROP COLUMN IF EXISTS bot_id;

-- Step 8: Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON public.user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user_id_new ON public.job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id_new ON public.job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_cover_letters_user_id_new ON public.job_cover_letters(user_id);

-- Phase 4: Recreate RLS policies with new structure
-- Since user_id now points to user_profile.id, we need to join through user_profile to get the clerk_id

-- Job Analyses policies
CREATE POLICY "Users can view their own job analyses" 
  ON public.job_analyses 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own job analyses" 
  ON public.job_analyses 
  FOR INSERT 
  WITH CHECK (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own job analyses" 
  ON public.job_analyses 
  FOR UPDATE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete their own job analyses" 
  ON public.job_analyses 
  FOR DELETE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Job Alerts policies
CREATE POLICY "Users can view their own job alerts" 
  ON public.job_alerts 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own job alerts" 
  ON public.job_alerts 
  FOR INSERT 
  WITH CHECK (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own job alerts" 
  ON public.job_alerts 
  FOR UPDATE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete their own job alerts" 
  ON public.job_alerts 
  FOR DELETE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Job Cover Letters policies
CREATE POLICY "Users can view their own job cover letters" 
  ON public.job_cover_letters 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own job cover letters" 
  ON public.job_cover_letters 
  FOR INSERT 
  WITH CHECK (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own job cover letters" 
  ON public.job_cover_letters 
  FOR UPDATE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete their own job cover letters" 
  ON public.job_cover_letters 
  FOR DELETE 
  USING (
    user_id IN (
      SELECT up.id FROM public.user_profile up 
      JOIN public.users u ON u.id = up.user_id 
      WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
  );
