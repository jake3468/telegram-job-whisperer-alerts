
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== WEBHOOK PAYLOAD TEST ===')
    
    const body = await req.json()
    console.log('Full webhook body:', JSON.stringify(body, null, 2))
    
    // Check if company_role_analysis exists and has id
    if (body.company_role_analysis) {
      console.log('Company analysis ID:', body.company_role_analysis.id)
      console.log('ID type:', typeof body.company_role_analysis.id)
    }
    
    // Test the exact URL that N8N would build
    const testId = body.company_role_analysis?.id
    if (testId) {
      const testUrl = `https://fnzloyyhzhrqsvslhhri.supabase.co/rest/v1/company_role_analyses?id=eq.${testId}`
      console.log('N8N would use this URL:', testUrl)
      
      // Try to fetch the record to see if it exists
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (supabaseUrl && serviceRoleKey) {
        const fetchResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        const fetchResult = await fetchResponse.json()
        console.log('Record exists check:', fetchResult)
        console.log('Found records:', fetchResult.length || 0)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook payload logged - check function logs for details',
        receivedId: body.company_role_analysis?.id,
        idType: typeof body.company_role_analysis?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
