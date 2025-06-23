
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { clerk_id, email, first_name, last_name } = await req.json()

    console.log('Creating user with data:', { clerk_id, email, first_name, last_name });

    if (!clerk_id || !email) {
      throw new Error('Missing required fields: clerk_id and email are required')
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('clerk_id', clerk_id)
      .single()

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: existingUser.id,
          message: 'User already exists'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create new user in users table
    const { data: newUser, error: userError } = await supabaseClient
      .from('users')
      .insert({
        clerk_id,
        email,
        first_name: first_name || null,
        last_name: last_name || null
      })
      .select('id')
      .single()

    if (userError) {
      console.error('Error creating user:', userError);
      throw userError
    }

    console.log('Created new user:', newUser.id);

    // Create user profile (this will trigger credit initialization via existing trigger)
    const { data: newProfile, error: profileError } = await supabaseClient
      .from('user_profile')
      .insert({
        user_id: newUser.id,
        bio: null,
        resume: null,
        bot_activated: false,
        cv_bot_activated: false
      })
      .select('id')
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If profile creation fails, we should clean up the user record
      await supabaseClient
        .from('users')
        .delete()
        .eq('id', newUser.id)
      
      throw profileError
    }

    console.log('Created user profile:', newProfile.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.id,
        profile_id: newProfile.id,
        message: 'User and profile created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in user-management function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
