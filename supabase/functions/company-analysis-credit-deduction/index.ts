
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, analysis_id, description } = await req.json()

    console.log('Company analysis credit deduction request:', {
      user_id,
      analysis_id,
      description: description || 'Company Analysis - Results Generated'
    })

    // Validate required fields
    if (!user_id || !analysis_id) {
      console.error('Missing required fields:', { user_id, analysis_id })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: user_id and analysis_id are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if analysis exists and belongs to user
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('company_role_analyses')
      .select('id, user_id')
      .eq('id', analysis_id)
      .eq('user_id', user_id)
      .single()

    if (analysisError || !analysisData) {
      console.error('Analysis not found or does not belong to user:', analysisError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Analysis not found or access denied' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deduct 3 credits using the database function
    const { data: deductionResult, error: deductionError } = await supabaseClient
      .rpc('deduct_credits', {
        p_user_id: user_id,
        p_amount: 3.0,
        p_feature_used: 'company_analysis',
        p_description: description || 'Company Analysis - Results Generated'
      })

    if (deductionError) {
      console.error('Error deducting credits:', deductionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to deduct credits',
          details: deductionError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!deductionResult) {
      console.log('Insufficient credits for user:', user_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient credits' 
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Credits deducted successfully for user:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credits deducted successfully',
        credits_deducted: 3.0,
        analysis_id: analysis_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in company analysis credit deduction:', error)
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
    )
  }
})
