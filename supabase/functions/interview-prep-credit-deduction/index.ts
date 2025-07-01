
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Interview prep credit deduction triggered');
    
    const payload = await req.json();
    const { interview_prep_id } = payload;

    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!interview_prep_id) {
      console.error('Missing interview_prep_id in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'interview_prep_id is required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Looking up interview prep with ID:', interview_prep_id);

    // Step 1: Look up interview prep to get user_id (note: user_id in interview_prep is actually the profile ID)
    const { data: interviewPrep, error: interviewPrepError } = await supabase
      .from('interview_prep')
      .select('user_id, id, company_name, job_title')
      .eq('id', interview_prep_id)
      .single();

    if (interviewPrepError || !interviewPrep) {
      console.error('Interview prep lookup error:', interviewPrepError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Interview prep not found with provided ID',
        interview_prep_id: interview_prep_id
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found interview prep:', interviewPrep);

    // Step 2: Get the actual user_id from user_profile table (interviewPrep.user_id is profile_id)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('id', interviewPrep.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile lookup error:', profileError);
      return new Response(JSON.stringify({
        success: false,
        error: 'User profile not found',
        profile_id: interviewPrep.user_id
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actualUserId = userProfile.user_id;
    console.log('Found actual user_id:', actualUserId);

    // Step 3: Check current user credits before attempting deduction
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', actualUserId)
      .single();

    if (creditsError || !userCredits) {
      console.error('Credits lookup error:', creditsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to fetch user credits',
        user_id: actualUserId,
        credits_error: creditsError?.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentBalance = Number(userCredits.current_balance);
    const requiredCredits = 2.0;

    console.log('Current balance:', currentBalance, 'Required:', requiredCredits);

    // Step 4: Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.log('Insufficient credits for user:', actualUserId);
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient credits',
        current_balance: currentBalance,
        required: requiredCredits
      }), { 
        status: 402, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 5: Deduct credits using the existing deduct_credits database function
    console.log('Attempting to deduct credits for user:', actualUserId);
    
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: actualUserId,
        p_amount: requiredCredits,
        p_feature_used: 'interview_prep',
        p_description: `Credits deducted for interview prep - ${interviewPrep.company_name} ${interviewPrep.job_title}`
      });

    if (deductionError) {
      console.error('Credit deduction error:', deductionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to deduct credits',
        details: deductionError.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!deductionResult) {
      console.error('Credit deduction failed - insufficient credits or other error');
      return new Response(JSON.stringify({
        success: false,
        error: 'Credit deduction failed',
        current_balance: currentBalance,
        required: requiredCredits
      }), { 
        status: 402, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Credit deduction successful for user:', actualUserId);

    // Step 6: Get updated balance for response
    const { data: updatedCredits, error: updatedCreditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', actualUserId)
      .single();

    const newBalance = updatedCreditsError ? currentBalance - requiredCredits : Number(updatedCredits.current_balance);

    // Step 7: Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Credits deducted successfully',
      credits_deducted: requiredCredits,
      previous_balance: currentBalance,
      remaining_balance: newBalance,
      user_id: actualUserId,
      profile_id: interviewPrep.user_id,
      interview_prep_id: interview_prep_id,
      interview_prep_details: {
        company_name: interviewPrep.company_name,
        job_title: interviewPrep.job_title
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in interview prep credit deduction:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
