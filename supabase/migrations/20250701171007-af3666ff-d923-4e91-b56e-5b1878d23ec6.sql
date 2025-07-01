
-- Add UPDATE RLS policy for linkedin_post_images to allow users to update their own images
CREATE POLICY "Users can update images for their posts" ON public.linkedin_post_images
    FOR UPDATE 
    USING (post_id IN (
        SELECT jl.id 
        FROM public.job_linkedin jl 
        JOIN public.user_profile up ON jl.user_id = up.id 
        JOIN public.users u ON u.id = up.user_id 
        WHERE u.clerk_id = get_clerk_user_id()
    ));
