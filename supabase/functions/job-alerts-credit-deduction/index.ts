
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

    const { alert_id } = await req.json()

    console.log('Job alerts credit deduction request:', { alert_id })

    // Validate required fields
    if (!alert_id) {
      console.error('Missing alert_id in request body')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'alert_id is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Looking up job alert and user information...')

    // Get the job alert and associated user information
    const { data: alertData, error: alertError } = await supabaseClient
      .from('job_alerts')
      .select(`
        id,
        user_id,
        country,
        location,
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
      .eq('id', alert_id)
      .single()

    if (alertError) {
      console.error('Error fetching job alert:', alertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Job alert not found', 
          details: alertError.message 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!alertData?.user_profile?.users) {
      console.error('User information not found for alert:', alert_id)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User information not found for this job alert' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const user = alertData.user_profile.users
    console.log('Found user for credit deduction:', { 
      userId: user.id, 
      email: user.email,
      alertId: alert_id 
    })

    // Deduct 1.5 credits using the database function
    console.log('Attempting to deduct 1.5 credits for job alert execution...')
    
    const { data: deductionResult, error: deductionError } = await supabaseClient
      .rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: 1.5,
        p_feature_used: 'job_alert_execution',
        p_description: `Job alert executed for ${alertData.job_title} in ${alertData.location}, ${alertData.country}`
      })

    if (deductionError) {
      console.error('Error deducting credits:', deductionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to deduct credits',
          details: deductionError.message,
          user_id: user.id,
          alert_id: alert_id
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
          alert_id: alert_id
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully deducted 1.5 credits for job alert execution')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credits deducted successfully for job alert execution',
        credits_deducted: 1.5,
        user_id: user.id,
        user_email: user.email,
        alert_id: alert_id,
        feature_used: 'job_alert_execution'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in job alerts credit deduction:', error)
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
