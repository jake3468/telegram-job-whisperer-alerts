
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { image_id, post_id, variation_number } = body;

    console.log('LinkedIn image credit deduction request:', { image_id, post_id, variation_number });

    // Validate required parameters
    if (!image_id) {
      console.error('Missing image_id in request body');
      return new Response(
        JSON.stringify({ error: 'image_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Looking up LinkedIn image and user information...');

    // Get the LinkedIn image and associated user information
    const { data: imageData, error: imageError } = await supabase
      .from('linkedin_post_images')
      .select(`
        id,
        post_id,
        variation_number,
        job_linkedin:post_id (
          id,
          user_id,
          user_profile:user_id (
            id,
            user_id,
            users:user_id (
              id,
              email,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', image_id)
      .single();

    if (imageError) {
      console.error('Error fetching LinkedIn image:', imageError);
      return new Response(
        JSON.stringify({ error: 'LinkedIn image not found', details: imageError.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!imageData?.job_linkedin?.user_profile?.users) {
      console.error('User information not found for image:', image_id);
      return new Response(
        JSON.stringify({ error: 'User information not found for this LinkedIn image' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = imageData.job_linkedin.user_profile.users;
    console.log('Found user for credit deduction:', { 
      userId: user.id, 
      email: user.email,
      imageId: image_id,
      postId: imageData.post_id,
      variationNumber: imageData.variation_number
    });

    // Deduct 1.5 credits for LinkedIn image generation
    console.log('Attempting to deduct 1.5 credits for LinkedIn image generation...');
    
    const { data: deductResult, error: deductError } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1.5,
      p_feature_used: 'linkedin_image',
      p_description: `LinkedIn image generation completed for post ${imageData.post_id}, variation ${imageData.variation_number}`
    });

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to deduct credits', 
          details: deductError.message,
          user_id: user.id,
          image_id: image_id
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!deductResult) {
      console.log('Credit deduction failed - insufficient balance');
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits', 
          message: 'User does not have enough credits for this operation',
          user_id: user.id,
          image_id: image_id
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully deducted 1.5 credits for LinkedIn image generation');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credits deducted successfully for LinkedIn image generation',
        credits_deducted: 1.5,
        user_id: user.id,
        user_email: user.email,
        image_id: image_id,
        post_id: imageData.post_id,
        variation_number: imageData.variation_number,
        feature_used: 'linkedin_image'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in LinkedIn image credit deduction:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
