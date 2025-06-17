
-- Drop all existing policies for both tables first
DROP POLICY IF EXISTS "Users can view image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update image counts for their posts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can view images for their posts" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert images for their posts" ON public.linkedin_post_images;

-- Drop any other potential policy names that might exist
DROP POLICY IF EXISTS "Users can view their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can insert their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can update their own image counts" ON public.linkedin_post_image_counts;
DROP POLICY IF EXISTS "Users can view their own images" ON public.linkedin_post_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.linkedin_post_images;

-- Enable RLS if not already enabled
ALTER TABLE public.linkedin_post_image_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_post_images ENABLE ROW LEVEL SECURITY;

-- Create new policies for linkedin_post_image_counts
CREATE POLICY "Users can view image counts for their posts" ON public.linkedin_post_image_counts
    FOR SELECT 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can insert image counts for their posts" ON public.linkedin_post_image_counts
    FOR INSERT 
    WITH CHECK (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

CREATE POLICY "Users can update image counts for their posts" ON public.linkedin_post_image_counts
    FOR UPDATE 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));

-- Create new policies for linkedin_post_images
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
