
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhook_id } = await req.json()
    
    console.log('🔧 MANUAL PROCESSING: Processing webhook_id:', webhook_id)
    
    if (!webhook_id) {
      console.error('❌ MANUAL PROCESSING: No webhook_id provided')
      return new Response(
        JSON.stringify({ error: 'webhook_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the unprocessed payment record
    console.log('🔍 MANUAL PROCESSING: Looking for payment record:', webhook_id)
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payment_records')
      .select('*')
      .eq('webhook_id', webhook_id)
      .eq('processed', false)
      .single()

    if (fetchError || !paymentRecord) {
      console.error('❌ MANUAL PROCESSING: Payment record not found or already processed:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Payment record not found or already processed',
          webhook_id: webhook_id
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ MANUAL PROCESSING: Found payment record:', {
      id: paymentRecord.id,
      event_type: paymentRecord.event_type,
      customer_email: paymentRecord.customer_email,
      product_id: paymentRecord.product_id,
      status: paymentRecord.status,
      processed: paymentRecord.processed
    })

    // Process the payment using the updated function
    console.log('🔄 MANUAL PROCESSING: Calling process_payment_credits function')
    const { data: result, error: processError } = await supabase.rpc('process_payment_credits', {
      p_webhook_id: paymentRecord.webhook_id,
      p_event_type: paymentRecord.event_type,
      p_customer_email: paymentRecord.customer_email,
      p_customer_name: paymentRecord.customer_name,
      p_product_id: paymentRecord.product_id,
      p_quantity: paymentRecord.quantity,
      p_amount: paymentRecord.amount,
      p_currency: paymentRecord.currency,
      p_status: paymentRecord.status,
      p_payment_id: paymentRecord.payment_id,
      p_subscription_id: paymentRecord.subscription_id,
      p_payment_method: paymentRecord.payment_method,
      p_error_code: paymentRecord.error_code,
      p_error_message: paymentRecord.error_message,
      p_webhook_timestamp: paymentRecord.webhook_timestamp,
      p_raw_payload: paymentRecord.raw_payload
    })

    if (processError) {
      console.error('❌ MANUAL PROCESSING: Error calling process_payment_credits:', processError)
      return new Response(
        JSON.stringify({ 
          error: 'Error processing payment',
          details: processError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ MANUAL PROCESSING: Payment processing result:', result)

    // Get updated user credits to verify the processing
    if (result?.success && result?.user_id) {
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('current_balance, paid_credits, subscription_plan')
        .eq('user_id', result.user_id)
        .single()

      console.log('📊 MANUAL PROCESSING: Updated user credits:', userCredits)

      // Get the latest credit transaction
      const { data: latestTransaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', result.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('💰 MANUAL PROCESSING: Latest credit transaction:', latestTransaction)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Payment processed successfully',
          processing_result: result,
          updated_user_credits: userCredits,
          latest_transaction: latestTransaction
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: result?.success || false,
        message: result?.message || 'Unknown processing result',
        processing_result: result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 MANUAL PROCESSING: Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
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
