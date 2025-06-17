
-- Drop existing RLS policies for linkedin_post_image_counts
DROP POLICY IF EXISTS "Users can view image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update image counts for their posts" ON public.linkedin_post_image_counts;

-- Create simpler, more direct RLS policies that focus on post ownership
-- Users can view image counts for posts they own
CREATE POLICY "Users can view image counts for their posts" ON public.linkedin_post_image_counts
    FOR SELECT 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Users can insert image counts for posts they own  
CREATE POLICY "Users can insert image counts for their posts" ON public.linkedin_post_image_counts
    FOR INSERT 
    WITH CHECK (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Users can update image counts for posts they own
CREATE POLICY "Users can update image counts for their posts" ON public.linkedin_post_image_counts
    FOR UPDATE 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Also ensure the linkedin_post_images table has proper RLS policies
DROP POLICY IF EXISTS "Users can view images for their posts" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert images for their posts" ON public.linkedin_post_images;

CREATE POLICY "Users can view images for their posts" ON public.linkedin_post_images
    FOR SELECT 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can insert images for their posts" ON public.linkedin_post_images
    FOR INSERT 
    WITH CHECK (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));
