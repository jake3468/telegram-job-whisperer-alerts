
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
    const { recordId } = await req.json()
    
    if (!recordId) {
      return new Response(
        JSON.stringify({ error: 'recordId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log(`Testing N8N-style update for record: ${recordId}`)

    // First, check if record exists
    const { data: existing, error: fetchError } = await supabase
      .from('company_role_analyses')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !existing) {
      console.error('Record not found:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Record not found', 
          details: fetchError 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found existing record:', existing)

    // Now try to update it like N8N would
    const testUpdate = {
      local_role_market_context: `Test update from debug function - ${new Date().toISOString()}`,
      role_security_score: 85,
      company_news_updates: ['Test news update'],
      sources: { test: 'This is a test source' }
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('company_role_analyses')
      .update(testUpdate)
      .eq('id', recordId)
      .select()

    if (updateError) {
      console.error('Update failed:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Update failed', 
          details: updateError 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Update successful:', updateResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test update completed successfully',
        originalRecord: existing,
        updateData: testUpdate,
        result: updateResult
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Debug function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
