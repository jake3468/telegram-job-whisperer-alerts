
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

    const { analysis_id } = await req.json()

    console.log('Company analysis credit deduction request:', { analysis_id })

    // Validate required fields
    if (!analysis_id) {
      console.error('Missing analysis_id in request body')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'analysis_id is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Looking up company analysis and user information...')

    // Get the company analysis and associated user information
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('company_role_analyses')
      .select(`
        id,
        user_id,
        company_name,
        job_title,
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
      .eq('id', analysis_id)
      .single()

    if (analysisError) {
      console.error('Error fetching company analysis:', analysisError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Company analysis not found', 
          details: analysisError.message 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!analysisData?.user_profile?.users) {
      console.error('User information not found for analysis:', analysis_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User information not found for this company analysis' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const user = analysisData.user_profile.users
    console.log('Found user for credit deduction:', { 
      userId: user.id, 
      email: user.email,
      analysisId: analysis_id 
    })

    // Deduct 3 credits using the database function
    console.log('Attempting to deduct 3 credits for company analysis...')
    
    const { data: deductionResult, error: deductionError } = await supabaseClient
      .rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: 3.0,
        p_feature_used: 'company_analysis',
        p_description: `Company analysis completed for ${analysisData.company_name} - ${analysisData.job_title}`
      })

    if (deductionError) {
      console.error('Error deducting credits:', deductionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to deduct credits',
          details: deductionError.message,
          user_id: user.id,
          analysis_id: analysis_id
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!deductionResult) {
      console.log('Credit deduction failed - insufficient balance')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient credits',
          message: 'User does not have enough credits for this operation',
          user_id: user.id,
          analysis_id: analysis_id
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully deducted 3 credits for company analysis')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credits deducted successfully for company analysis',
        credits_deducted: 3.0,
        user_id: user.id,
        user_email: user.email,
        analysis_id: analysis_id,
        feature_used: 'company_analysis'
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
