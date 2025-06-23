
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
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Test 2: Try to insert a test record
    console.log('Test 2: Inserting test record...')
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
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

    // Test 3: Clean up the test record
    if (insertData && insertData.length > 0) {
      await supabase
        .from('company_role_analyses')
        .delete()
        .eq('id', insertData[0].id)
      console.log('Test record cleaned up')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Service role access test passed',
        readCount: readData?.length || 0,
        insertedRecord: insertData?.[0] || null
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
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
