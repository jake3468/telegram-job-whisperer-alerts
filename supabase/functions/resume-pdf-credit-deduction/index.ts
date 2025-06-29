
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
    console.log('Resume PDF credit deduction triggered');
    
    const payload = await req.json();
    const { cv_chat_id } = payload;

    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!cv_chat_id) {
      console.error('Missing cv_chat_id in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'cv_chat_id is required'
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

    console.log('Looking up user with cv_chat_id:', cv_chat_id);

    // Step 1: Look up user by cv_chat_id to get user_id
    const { data: userProfile, error: userLookupError } = await supabase
      .from('user_profile')
      .select('user_id, id')
      .eq('cv_chat_id', cv_chat_id)
      .single();

    if (userLookupError || !userProfile) {
      console.error('User lookup error:', userLookupError);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found with provided cv_chat_id',
        cv_chat_id: cv_chat_id
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found user:', userProfile);

    // Step 2: Check current user credits before attempting deduction
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userProfile.user_id)
      .single();

    if (creditsError || !userCredits) {
      console.error('Credits lookup error:', creditsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to fetch user credits',
        user_id: userProfile.user_id
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentBalance = Number(userCredits.current_balance);
    const requiredCredits = 2;

    console.log('Current balance:', currentBalance, 'Required:', requiredCredits);

    // Step 3: Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.log('Insufficient credits for user:', userProfile.user_id);
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

    // Step 4: Deduct credits using the existing deduct_credits database function
    console.log('Attempting to deduct credits for user:', userProfile.user_id);
    
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userProfile.user_id,
        p_amount: requiredCredits,
        p_feature_used: 'resume_pdf',
        p_description: 'Credits deducted for resume PDF generation'
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

    console.log('Credit deduction successful for user:', userProfile.user_id);

    // Step 5: Get updated balance for response
    const { data: updatedCredits, error: updatedCreditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userProfile.user_id)
      .single();

    const newBalance = updatedCreditsError ? currentBalance - requiredCredits : Number(updatedCredits.current_balance);

    // Step 6: Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Credits deducted successfully',
      credits_deducted: requiredCredits,
      previous_balance: currentBalance,
      remaining_balance: newBalance,
      user_id: userProfile.user_id,
      cv_chat_id: cv_chat_id
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in resume PDF credit deduction:', error);
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
