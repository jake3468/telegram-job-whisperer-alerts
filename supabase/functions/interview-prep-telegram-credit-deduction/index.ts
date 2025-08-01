import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST requests are supported.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse the request body
    const body = await req.json()
    const { user_profile_id } = body

    // Validate required fields
    if (!user_profile_id) {
      console.error('Missing required field: user_profile_id')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: user_profile_id',
          message: 'Please provide user_profile_id in the request body'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing Telegram interview prep credit deduction for profile: ${user_profile_id}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the actual user_id from user_profile table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('id', user_profile_id)
      .single()

    if (profileError || !profileData) {
      console.error('User profile not found:', profileError)
      return new Response(
        JSON.stringify({ 
          error: 'User profile not found',
          message: `No profile found with ID: ${user_profile_id}`
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = profileData.user_id
    console.log(`Found user ID: ${userId} for profile: ${user_profile_id}`)

    // Check current credit balance
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsData) {
      console.error('Error fetching user credits:', creditsError)
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching user credits',
          message: 'Unable to retrieve current credit balance'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const currentBalance = creditsData.current_balance
    const requiredCredits = 6.0

    // Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.log(`Insufficient credits. Current: ${currentBalance}, Required: ${requiredCredits}`)
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          message: `You need ${requiredCredits} credits but only have ${currentBalance} credits available`,
          current_balance: currentBalance,
          required_credits: requiredCredits
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct credits using the RPC function
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: requiredCredits,
        p_feature_used: 'interview_prep_telegram',
        p_description: 'Interview Prep - telegram'
      })

    if (deductionError || !deductionResult) {
      console.error('Credit deduction failed:', deductionError)
      return new Response(
        JSON.stringify({ 
          error: 'Credit deduction failed',
          message: 'Unable to deduct credits from your account'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully deducted credits. Previous: ${currentBalance} New: ${currentBalance - requiredCredits}`)

    // Get the latest transaction details for confirmation
    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_used', 'interview_prep_telegram')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Interview Prep credits deducted successfully',
        credits_deducted: requiredCredits,
        previous_balance: currentBalance,
        new_balance: currentBalance - requiredCredits,
        user_profile_id: user_profile_id,
        user_id: userId,
        transaction: transactionData || null,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in interview prep credit deduction:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})