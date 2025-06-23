
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Test function called - checking service role access to company_role_analyses')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!serviceRoleKey
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Test 1: Try to read from the table
    console.log('Test 1: Reading from company_role_analyses table...')
    const { data: readData, error: readError } = await supabase
      .from('company_role_analyses')
      .select('*')
      .limit(5)

    if (readError) {
      console.error('Read test failed:', readError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Read test failed', 
          details: readError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Read test successful, found', readData?.length || 0, 'records')

    // Test 2: Get a real user_profile ID to use for testing, or create one if none exist
    console.log('Test 2: Getting or creating a user_profile ID...')
    let { data: userProfiles, error: userProfileError } = await supabase
      .from('user_profile')
      .select('id')
      .limit(1)

    let testUserId: string

    if (userProfileError || !userProfiles || userProfiles.length === 0) {
      console.log('No user profiles found, creating a test user and profile...')
      
      // Create a test user first
      const { data: testUser, error: userError } = await supabase
        .from('users')
        .insert({
          clerk_id: 'test_user_' + Date.now(),
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        })
        .select()
        .single()
      
      if (userError || !testUser) {
        console.error('Failed to create test user:', userError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create test user', 
            details: userError 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Created test user:', testUser.id)

      // Create a test user profile
      const { data: testProfile, error: profileError } = await supabase
        .from('user_profile')
        .insert({
          user_id: testUser.id,
          bio: 'Test user profile for service role testing'
        })
        .select()
        .single()
      
      if (profileError || !testProfile) {
        console.error('Failed to create test profile:', profileError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create test profile', 
            details: profileError 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      testUserId = testProfile.id
      console.log('Created test profile with ID:', testUserId)
    } else {
      testUserId = userProfiles[0].id
      console.log('Using existing user_profile ID for test:', testUserId)
    }

    // Test 3: Try to insert a test record with real user_id
    console.log('Test 3: Inserting test record...')
    const testRecord = {
      user_id: testUserId,
      company_name: 'Test Company ' + Date.now(),
      location: 'Test Location',
      job_title: 'Test Position',
      local_role_market_context: 'This is a test record created by service role'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('company_role_analyses')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.error('Insert test failed:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insert test failed', 
          details: insertError,
          testRecord
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Insert test successful:', insertData)

    // Test 4: Clean up the test record
    if (insertData && insertData.length > 0) {
      const { error: deleteError } = await supabase
        .from('company_role_analyses')
        .delete()
        .eq('id', insertData[0].id)
      
      if (deleteError) {
        console.log('Warning: Could not clean up test record:', deleteError)
      } else {
        console.log('Test record cleaned up successfully')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Service role access test passed - N8N can write to company_role_analyses table',
        readCount: readData?.length || 0,
        insertedRecord: insertData?.[0] || null,
        testUserId: testUserId,
        environment: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test function error', 
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
