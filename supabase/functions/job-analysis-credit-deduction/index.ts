
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
    console.log('Job analysis credit deduction triggered');
    
    const payload = await req.json();
    const { job_analysis_id } = payload;

    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!job_analysis_id) {
      console.error('Missing job_analysis_id in request');
      return new Response(JSON.stringify({
        success: false,
        error: 'job_analysis_id is required'
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

    console.log('Looking up job analysis with ID:', job_analysis_id);

    // Step 1: Look up job analysis to get user_id
    const { data: jobAnalysis, error: jobAnalysisError } = await supabase
      .from('job_analyses')
      .select('user_id, id, company_name, job_title')
      .eq('id', job_analysis_id)
      .single();

    if (jobAnalysisError || !jobAnalysis) {
      console.error('Job analysis lookup error:', jobAnalysisError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Job analysis not found with provided ID',
        job_analysis_id: job_analysis_id
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found job analysis:', jobAnalysis);

    // Step 2: Check current user credits before attempting deduction
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', jobAnalysis.user_id)
      .single();

    if (creditsError || !userCredits) {
      console.error('Credits lookup error:', creditsError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to fetch user credits',
        user_id: jobAnalysis.user_id
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentBalance = Number(userCredits.current_balance);
    const requiredCredits = 1.0;

    console.log('Current balance:', currentBalance, 'Required:', requiredCredits);

    // Step 3: Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.log('Insufficient credits for user:', jobAnalysis.user_id);
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
    console.log('Attempting to deduct credits for user:', jobAnalysis.user_id);
    
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: jobAnalysis.user_id,
        p_amount: requiredCredits,
        p_feature_used: 'job_analysis',
        p_description: `Credits deducted for job analysis - ${jobAnalysis.company_name} ${jobAnalysis.job_title}`
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

    console.log('Credit deduction successful for user:', jobAnalysis.user_id);

    // Step 5: Get updated balance for response
    const { data: updatedCredits, error: updatedCreditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', jobAnalysis.user_id)
      .single();

    const newBalance = updatedCreditsError ? currentBalance - requiredCredits : Number(updatedCredits.current_balance);

    // Step 6: Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Credits deducted successfully',
      credits_deducted: requiredCredits,
      previous_balance: currentBalance,
      remaining_balance: newBalance,
      user_id: jobAnalysis.user_id,
      job_analysis_id: job_analysis_id,
      job_details: {
        company_name: jobAnalysis.company_name,
        job_title: jobAnalysis.job_title
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in job analysis credit deduction:', error);
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
