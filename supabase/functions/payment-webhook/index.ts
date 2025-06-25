
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the webhook payload
    const payload = await req.json();
    
    console.log('Received DodoPayments webhook:', JSON.stringify(payload, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract webhook data
    const webhookId = payload.headers?.['webhook-id'] || `evt_${Date.now()}`;
    const eventType = payload.body?.type;
    const timestamp = payload.body?.timestamp;
    const data = payload.body?.data;

    if (!eventType || !data) {
      console.error('Invalid webhook payload structure');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract customer and payment information
    const customerEmail = data.customer?.email;
    const customerName = data.customer?.name;
    
    let productId: string | null = null;
    let quantity = 1;
    let amount: number | null = null;
    let currency: string | null = null;
    let status: string | null = null;
    let paymentId: string | null = null;
    let subscriptionId: string | null = null;
    let paymentMethod: string | null = null;
    let errorCode: string | null = null;
    let errorMessage: string | null = null;

    // Handle different event types
    if (eventType === 'subscription.renewed' || eventType === 'subscription.created') {
      // Subscription events
      productId = data.product_id;
      quantity = data.quantity || 1;
      amount = data.recurring_pre_tax_amount ? data.recurring_pre_tax_amount / 100 : null;
      currency = data.currency;
      status = data.status;
      subscriptionId = data.subscription_id;
      
    } else if (eventType === 'payment.completed' || eventType === 'payment.failed') {
      // Payment events
      paymentId = data.payment_id;
      amount = data.total_amount ? data.total_amount / 100 : null;
      currency = data.currency;
      status = data.status;
      paymentMethod = data.payment_method;
      errorCode = data.error_code;
      errorMessage = data.error_message;
      
      // Extract product ID from product_cart
      if (data.product_cart && data.product_cart.length > 0) {
        productId = data.product_cart[0].product_id;
        quantity = data.product_cart[0].quantity || 1;
      }
      
    } else if (eventType === 'subscription.cancelled') {
      // Subscription cancellation
      subscriptionId = data.subscription_id;
      productId = data.product_id;
      status = 'cancelled';
    }

    if (!customerEmail) {
      console.error('No customer email found in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Customer email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing payment webhook:', {
      webhookId,
      eventType,
      customerEmail,
      productId,
      amount,
      status
    });

    // Call the Supabase function to process the payment
    const { data: result, error } = await supabase.rpc('process_payment_credits', {
      p_webhook_id: webhookId,
      p_event_type: eventType,
      p_customer_email: customerEmail,
      p_customer_name: customerName,
      p_product_id: productId,
      p_quantity: quantity,
      p_amount: amount,
      p_currency: currency,
      p_status: status,
      p_payment_id: paymentId,
      p_subscription_id: subscriptionId,
      p_payment_method: paymentMethod,
      p_error_code: errorCode,
      p_error_message: errorMessage,
      p_webhook_timestamp: timestamp,
      p_raw_payload: payload.body
    });

    if (error) {
      console.error('Error processing payment:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to process payment', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Payment processing result:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        result 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
