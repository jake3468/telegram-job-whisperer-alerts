
-- Drop all possible existing policies with various names
DROP POLICY IF EXISTS "Users can view image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can view their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update their own image counts" ON public.linkedin_post_image_counts;

DROP POLICY IF EXISTS "Users can view images for their posts" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert images for their posts" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can view their own images" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.linkedin_post_images;

-- Create simple, direct RLS policies using the user_id column
CREATE POLICY "Users can view their own image counts" ON public.linkedin_post_image_counts
    FOR SELECT 
    USING (user_id = (SELECT id FROM public.users WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Users can insert their own image counts" ON public.linkedin_post_image_counts
    FOR INSERT 
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Users can update their own image counts" ON public.linkedin_post_image_counts
    FOR UPDATE 
    USING (user_id = (SELECT id FROM public.users WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Users can view their own images" ON public.linkedin_post_images
    FOR SELECT 
    USING (user_id = (SELECT id FROM public.users WHERE clerk_id = get_clerk_user_id()));

CREATE POLICY "Users can insert their own images" ON public.linkedin_post_images
    FOR INSERT 
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE clerk_id = get_clerk_user_id()));
