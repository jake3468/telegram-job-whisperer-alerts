
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
    console.log('Testing service role access to company_role_analyses after RLS policy reset')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing environment variables' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Test 1: Check current RLS policies
    console.log('Step 1: Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec', {
        sql: `SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
              FROM pg_policies 
              WHERE tablename = 'company_role_analyses' 
              ORDER BY policyname;`
      })

    console.log('Current RLS policies:', policies)

    // Test 2: Read existing records
    console.log('Step 2: Testing SELECT access...')
    const { data: readData, error: readError } = await supabase
      .from('company_role_analyses')
      .select('id, company_name, job_title, created_at')
      .limit(3)

    if (readError) {
      console.error('READ failed:', readError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service role cannot read from table', 
          details: readError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('READ test passed. Found', readData?.length || 0, 'existing records')

    // Test 3: Get a valid user_profile ID
    console.log('Step 3: Getting user_profile ID for test...')
    const { data: userProfiles, error: profileError } = await supabase
      .from('user_profile')
      .select('id')
      .limit(1)

    let testUserId: string

    if (profileError || !userProfiles || userProfiles.length === 0) {
      console.log('No user profiles found, creating test data...')
      
      // Create test user
      const { data: testUser, error: userError } = await supabase
        .from('users')
        .insert({
          clerk_id: 'test_service_' + Date.now(),
          email: 'test-service@example.com',
          first_name: 'Service',
          last_name: 'Test'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('Failed to create test user:', userError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Cannot create test user', 
            details: userError 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create test profile
      const { data: testProfile, error: profileCreateError } = await supabase
        .from('user_profile')
        .insert({
          user_id: testUser.id,
          bio: 'Test profile for service role testing'
        })
        .select()
        .single()
      
      if (profileCreateError) {
        console.error('Failed to create test profile:', profileCreateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Cannot create test profile', 
            details: profileCreateError 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      testUserId = testProfile.id
    } else {
      testUserId = userProfiles[0].id
    }

    console.log('Using user_profile ID:', testUserId)

    // Test 4: INSERT test
    console.log('Step 4: Testing INSERT access...')
    const testRecord = {
      user_id: testUserId,
      company_name: 'Service Role Test Company ' + Date.now(),
      location: 'Test Location',
      job_title: 'Test Position',
      local_role_market_context: 'Service role insert test - ' + new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('company_role_analyses')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.error('INSERT failed:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service role cannot insert into table', 
          details: insertError,
          testRecord: testRecord
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('INSERT test passed:', insertData?.[0]?.id)

    // Test 5: UPDATE test
    if (insertData && insertData.length > 0) {
      console.log('Step 5: Testing UPDATE access...')
      const { data: updateData, error: updateError } = await supabase
        .from('company_role_analyses')
        .update({ 
          local_role_market_context: 'Updated by service role - ' + new Date().toISOString() 
        })
        .eq('id', insertData[0].id)
        .select()

      if (updateError) {
        console.error('UPDATE failed:', updateError)
      } else {
        console.log('UPDATE test passed')
      }
    }

    // Test 6: Cleanup
    if (insertData && insertData.length > 0) {
      console.log('Step 6: Cleaning up test record...')
      const { error: deleteError } = await supabase
        .from('company_role_analyses')
        .delete()
        .eq('id', insertData[0].id)
      
      if (deleteError) {
        console.log('Warning: Could not clean up test record:', deleteError)
      } else {
        console.log('Cleanup successful')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Service role access test completed successfully',
        testResults: {
          canRead: !readError,
          canInsert: !insertError,
          recordCount: readData?.length || 0,
          testUserId: testUserId,
          insertedRecordId: insertData?.[0]?.id || null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Test function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test function error', 
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
