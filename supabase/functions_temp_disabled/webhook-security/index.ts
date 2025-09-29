
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fingerprint, x-source, x-webhook-type',
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const isRateLimited = (identifier: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (record.count >= limit) {
    return true
  }
  
  record.count++
  return false
}

const validateWebhookPayload = (payload: any): boolean => {
  // Basic payload validation
  if (!payload || typeof payload !== 'object') {
    return false
  }
  
  // Check for required fields based on webhook type
  const requiredFields = ['event_type', 'webhook_type', 'timestamp']
  for (const field of requiredFields) {
    if (!payload[field]) {
      return false
    }
  }
  
  // Validate timestamp is recent (within 5 minutes)
  const timestamp = new Date(payload.timestamp)
  const now = new Date()
  const timeDiff = Math.abs(now.getTime() - timestamp.getTime())
  if (timeDiff > 5 * 60 * 1000) { // 5 minutes
    return false
  }
  
  return true
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting based on IP
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    if (isRateLimited(clientIP, 30, 60000)) { // 30 requests per minute
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and validate payload
    const payload = await req.json()
    if (!validateWebhookPayload(payload)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log webhook for monitoring
    console.log(`Webhook received: ${payload.webhook_type} - ${payload.event_type}`)

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process webhook based on type
    let response
    switch (payload.webhook_type) {
      case 'job_guide':
        response = await processJobAnalysisWebhook(supabase, payload)
        break
      case 'cover_letter':
        response = await processCoverLetterWebhook(supabase, payload)
        break
      case 'linkedin_post':
        response = await processLinkedInWebhook(supabase, payload)
        break
      case 'company_analysis':
        response = await processCompanyAnalysisWebhook(supabase, payload)
        break
      case 'interview_prep':
        response = await processInterviewPrepWebhook(supabase, payload)
        break
      default:
        throw new Error(`Unknown webhook type: ${payload.webhook_type}`)
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Individual webhook processors with security validation
async function processJobAnalysisWebhook(supabase: any, payload: any) {
  // Additional validation for job analysis webhooks
  if (!payload.job_analysis || !payload.user) {
    throw new Error('Invalid job analysis payload')
  }
  
  // Process the webhook securely
  console.log('Processing job analysis webhook:', payload.job_analysis.id)
  return { status: 'processed', type: 'job_analysis' }
}

async function processCoverLetterWebhook(supabase: any, payload: any) {
  if (!payload.job_cover_letter || !payload.user) {
    throw new Error('Invalid cover letter payload')
  }
  
  console.log('Processing cover letter webhook:', payload.job_cover_letter.id)
  return { status: 'processed', type: 'cover_letter' }
}

async function processLinkedInWebhook(supabase: any, payload: any) {
  if (!payload.job_linkedin || !payload.user) {
    throw new Error('Invalid LinkedIn payload')
  }
  
  console.log('Processing LinkedIn webhook:', payload.job_linkedin.id)
  return { status: 'processed', type: 'linkedin_post' }
}

async function processCompanyAnalysisWebhook(supabase: any, payload: any) {
  if (!payload.company_role_analysis || !payload.user) {
    throw new Error('Invalid company analysis payload')
  }
  
  console.log('Processing company analysis webhook:', payload.company_role_analysis.id)
  return { status: 'processed', type: 'company_analysis' }
}

async function processInterviewPrepWebhook(supabase: any, payload: any) {
  if (!payload.interview_prep || !payload.user) {
    throw new Error('Invalid interview prep payload')
  }
  
  console.log('Processing interview prep webhook:', payload.interview_prep.id)
  return { status: 'processed', type: 'interview_prep' }
}
