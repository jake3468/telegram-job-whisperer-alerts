import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse request body
    const { user_profile_id } = await req.json()

    // Validate required fields
    if (!user_profile_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: user_profile_id',
          required_fields: ['user_profile_id']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing Telegram resume credit deduction for profile:', user_profile_id)

    // Get user data from user_profile table
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
          user_profile_id: user_profile_id
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = profileData.user_id
    console.log('Found user ID:', userId, 'for profile:', user_profile_id)

    // Check current credit balance
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single()

    if (creditError || !creditData) {
      console.error('Error fetching user credits:', creditError)
      return new Response(
        JSON.stringify({ 
          error: 'User credits not found',
          user_id: userId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const currentBalance = parseFloat(creditData.current_balance.toString())
    const requiredCredits = 2

    // Check if user has sufficient credits
    if (currentBalance < requiredCredits) {
      console.log('Insufficient credits. Current:', currentBalance, 'Required:', requiredCredits)
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          current_balance: currentBalance,
          required_credits: requiredCredits,
          shortfall: requiredCredits - currentBalance
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct credits using the RPC function
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: requiredCredits,
        p_feature_used: 'resume_telegram',
        p_description: 'Resume - telegram'
      })

    if (deductError || !deductResult) {
      console.error('Error deducting credits:', deductError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to deduct credits',
          details: deductError?.message || 'Unknown error during credit deduction'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get updated balance
    const { data: updatedCreditData, error: updatedCreditError } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', userId)
      .single()

    const newBalance = updatedCreditData ? parseFloat(updatedCreditData.current_balance.toString()) : currentBalance - requiredCredits

    console.log('Successfully deducted credits. Previous:', currentBalance, 'New:', newBalance)

    // Get the latest transaction for confirmation
    const { data: transactionData } = await supabase
      .from('credit_transactions')
      .select('id, created_at, description')
      .eq('user_id', userId)
      .eq('feature_used', 'resume_telegram')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credits deducted successfully for Telegram resume',
        user_profile_id: user_profile_id,
        user_id: userId,
        credits_deducted: requiredCredits,
        previous_balance: currentBalance,
        current_balance: newBalance,
        transaction: transactionData || null,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in resume Telegram credit deduction:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})