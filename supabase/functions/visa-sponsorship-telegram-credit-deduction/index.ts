import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST requests are accepted.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('[visa-sponsorship-telegram-credit-deduction] Function started')
    
    // Parse request body
    const body = await req.json()
    console.log('[visa-sponsorship-telegram-credit-deduction] Request body:', body)
    
    const { user_profile_id } = body
    
    if (!user_profile_id) {
      console.error('[visa-sponsorship-telegram-credit-deduction] Missing user_profile_id')
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: user_profile_id',
          success: false 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[visa-sponsorship-telegram-credit-deduction] Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[visa-sponsorship-telegram-credit-deduction] Supabase client initialized')

    // Get user_id from user_profile table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('id', user_profile_id)
      .single()

    if (profileError || !profileData) {
      console.error('[visa-sponsorship-telegram-credit-deduction] User profile not found:', profileError)
      return new Response(
        JSON.stringify({ 
          error: `User profile not found for ID: ${user_profile_id}`,
          success: false,
          user_profile_id: user_profile_id
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = profileData.user_id
    console.log('[visa-sponsorship-telegram-credit-deduction] Found user_id:', userId)

    // Check current credit balance
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single()

    if (creditsError || !creditsData) {
      console.error('[visa-sponsorship-telegram-credit-deduction] Failed to fetch user credits:', creditsError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user credits',
          success: false,
          user_id: userId,
          user_profile_id: user_profile_id
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const currentBalance = Number(creditsData.current_balance)
    const requiredCredits = 2.0

    console.log('[visa-sponsorship-telegram-credit-deduction] Current balance:', currentBalance, 'Required:', requiredCredits)

    // Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.warn('[visa-sponsorship-telegram-credit-deduction] Insufficient credits')
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          success: false,
          current_balance: currentBalance,
          required_credits: requiredCredits,
          user_id: userId,
          user_profile_id: user_profile_id
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct credits using the RPC function
    const { data: deductionResult, error: deductionError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: requiredCredits,
      p_feature_used: 'visa_sponsorship_telegram',
      p_description: 'Visa Sponsor details - telegram'
    })

    if (deductionError || !deductionResult) {
      console.error('[visa-sponsorship-telegram-credit-deduction] Credit deduction failed:', deductionError)
      return new Response(
        JSON.stringify({ 
          error: 'Credit deduction failed',
          success: false,
          user_id: userId,
          user_profile_id: user_profile_id,
          deduction_error: deductionError?.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('[visa-sponsorship-telegram-credit-deduction] Credits deducted successfully')

    // Fetch the latest transaction for confirmation
    const { data: transactionData, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_used', 'visa_sponsorship_telegram')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (transactionError) {
      console.warn('[visa-sponsorship-telegram-credit-deduction] Could not fetch transaction details:', transactionError)
    }

    // Calculate new balance
    const newBalance = currentBalance - requiredCredits

    const response = {
      success: true,
      message: 'Visa sponsorship credits deducted successfully',
      credits_deducted: requiredCredits,
      previous_balance: currentBalance,
      new_balance: newBalance,
      user_id: userId,
      user_profile_id: user_profile_id,
      transaction: transactionData || null,
      timestamp: new Date().toISOString()
    }

    console.log('[visa-sponsorship-telegram-credit-deduction] Success response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[visa-sponsorship-telegram-credit-deduction] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        success: false,
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})