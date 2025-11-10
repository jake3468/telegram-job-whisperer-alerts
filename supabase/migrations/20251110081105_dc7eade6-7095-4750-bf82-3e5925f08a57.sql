ALTER TABLE public.user_profile
ADD COLUMN jobalerts_username TEXT DEFAULT NULL,
ADD COLUMN resume_username TEXT DEFAULT NULL,
ADD COLUMN jobapplication_username TEXT DEFAULT NULL;