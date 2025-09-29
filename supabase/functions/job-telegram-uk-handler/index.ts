import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Job telegram UK handler request:', req.method)

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      })
    }

    // Parse request body
    const body = await req.json()
    console.log('Job telegram UK handler request body:', body)

    const { job_title_param, company_name_param } = body

    if (!job_title_param || !company_name_param) {
      return new Response('Missing job_title_param or company_name_param', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('Processing job entry:', { job_title_param, company_name_param })

    // Check if entry already exists
    const { data: existingData, error: selectError } = await supabase
      .from('job_telegram_uk')
      .select('id')
      .eq('job_title', job_title_param)
      .eq('company_name', company_name_param)
      .maybeSingle()

    if (selectError) {
      console.error('Error checking existing entry:', selectError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    // If entry exists, return "exists"
    if (existingData) {
      console.log('Entry already exists:', existingData.id)
      return new Response('exists', { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Entry doesn't exist, insert new one
    const { data: insertData, error: insertError } = await supabase
      .from('job_telegram_uk')
      .insert({
        job_title: job_title_param,
        company_name: company_name_param
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting new entry:', insertError)
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    console.log('Successfully added new entry:', insertData.id)
    return new Response('added', { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    console.error('Error in job telegram UK handler:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})