
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
    const { post_id } = body;

    console.log('LinkedIn credit deduction request:', { post_id });

    // Validate required parameters
    if (!post_id) {
      console.error('Missing post_id in request body');
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
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

    console.log('Looking up LinkedIn post and user information...');

    // Get the LinkedIn post and associated user information
    const { data: postData, error: postError } = await supabase
      .from('job_linkedin')
      .select(`
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
      `)
      .eq('id', post_id)
      .single();

    if (postError) {
      console.error('Error fetching LinkedIn post:', postError);
      return new Response(
        JSON.stringify({ error: 'LinkedIn post not found', details: postError.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!postData?.user_profile?.users) {
      console.error('User information not found for post:', post_id);
      return new Response(
        JSON.stringify({ error: 'User information not found for this LinkedIn post' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = postData.user_profile.users;
    console.log('Found user for credit deduction:', { 
      userId: user.id, 
      email: user.email,
      postId: post_id 
    });

    // Deduct 3 credits for LinkedIn post generation
    console.log('Attempting to deduct 3 credits for LinkedIn post generation...');
    
    const { data: deductResult, error: deductError } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 3.0,
      p_feature_used: 'linkedin_post',
      p_description: `LinkedIn post generation completed for post ${post_id}`
    });

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to deduct credits', 
          details: deductError.message,
          user_id: user.id,
          post_id: post_id
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
          post_id: post_id
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully deducted 3 credits for LinkedIn post generation');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credits deducted successfully for LinkedIn post generation',
        credits_deducted: 3.0,
        user_id: user.id,
        user_email: user.email,
        post_id: post_id,
        feature_used: 'linkedin_post'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in LinkedIn credit deduction:', error);
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
