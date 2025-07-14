import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('AI Interview Credit Deduction function called:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse request body
    const { grace_interview_requests_id, description } = await req.json();
    
    console.log('Request data:', { grace_interview_requests_id, description });

    // Validate required fields
    if (!grace_interview_requests_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'grace_interview_requests_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get the grace interview request to find the user_profile_id
    const { data: graceRequest, error: graceError } = await supabase
      .from('grace_interview_requests')
      .select('user_id')
      .eq('id', grace_interview_requests_id)
      .single();

    if (graceError || !graceRequest) {
      console.error('Grace interview request not found:', graceError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid grace_interview_requests_id' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the actual user_id from user_profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('id', graceRequest.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the AI interview credits record for this user
    const { data: creditsRecord, error: creditsError } = await supabase
      .from('ai_interview_credits')
      .select('user_id, remaining_credits, used_credits, total_credits')
      .eq('user_id', userProfile.user_id)
      .single();

    if (creditsError || !creditsRecord) {
      console.error('AI interview credits record not found:', creditsError);
      return new Response(
        JSON.stringify({ success: false, error: 'AI interview credits not found for user' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Found credits record for user:', creditsRecord);

    // Check if user has sufficient credits
    if (creditsRecord.remaining_credits <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient credits',
          remaining_credits: creditsRecord.remaining_credits 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use the existing database function to deduct credit
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('use_ai_interview_credit', {
        p_user_id: userProfile.user_id,
        p_description: description || `AI mock interview credit deducted for interview ${grace_interview_requests_id}`
      });

    if (deductionError || !deductionResult) {
      console.error('Credit deduction failed:', deductionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to deduct credit',
          details: deductionError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Credit deduction successful:', deductionResult);

    // Get updated credits information
    const { data: updatedCredits, error: updateError } = await supabase
      .from('ai_interview_credits')
      .select('remaining_credits, used_credits, total_credits')
      .eq('user_id', userProfile.user_id)
      .single();

    if (updateError) {
      console.error('Failed to get updated credits:', updateError);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credit deducted successfully',
        remaining_credits: updatedCredits?.remaining_credits || (creditsRecord.remaining_credits - 1),
        used_credits: updatedCredits?.used_credits || (creditsRecord.used_credits + 1),
        total_credits: updatedCredits?.total_credits || creditsRecord.total_credits
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in ai-interview-credit-deduction:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
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