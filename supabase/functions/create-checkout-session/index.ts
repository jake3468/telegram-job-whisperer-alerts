
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
    const { productId } = await req.json()
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get product details from database
    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the payment link from Supabase Vault based on product type and region
    let secretName = ''
    
    // Determine the secret name based on product details
    if (product.product_type === 'subscription') {
      secretName = product.currency === 'INR' ? 'PAYMENT_LINK_INR_MONTHLY_SUBSCRIPTION' : 'PAYMENT_LINK_USD_MONTHLY_SUBSCRIPTION'
    } else {
      // Credit packs - map by credits amount and currency
      const creditAmount = product.credits_amount
      const currency = product.currency
      
      if (currency === 'INR') {
        switch (creditAmount) {
          case 50:
            secretName = 'PAYMENT_LINK_INR_50_CREDITS'
            break
          case 100:
            secretName = 'PAYMENT_LINK_INR_100_CREDITS'
            break
          case 200:
            secretName = 'PAYMENT_LINK_INR_200_CREDITS'
            break
          case 500:
            secretName = 'PAYMENT_LINK_INR_500_CREDITS'
            break
          default:
            secretName = `PAYMENT_LINK_INR_${creditAmount}_CREDITS`
        }
      } else {
        switch (creditAmount) {
          case 50:
            secretName = 'PAYMENT_LINK_USD_50_CREDITS'
            break
          case 100:
            secretName = 'PAYMENT_LINK_USD_100_CREDITS'
            break
          case 200:
            secretName = 'PAYMENT_LINK_USD_200_CREDITS'
            break
          case 500:
            secretName = 'PAYMENT_LINK_USD_500_CREDITS'
            break
          default:
            secretName = `PAYMENT_LINK_USD_${creditAmount}_CREDITS`
        }
      }
    }

    // Get the payment link from vault
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', secretName)
      .single()

    if (secretError || !secretData?.decrypted_secret) {
      console.error(`Payment link not found for secret: ${secretName}`, secretError)
      return new Response(
        JSON.stringify({ 
          error: 'Payment link not configured',
          details: `Missing payment link for ${secretName}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentUrl = secretData.decrypted_secret

    // Log the checkout session creation
    console.log(`Checkout session created for user ${user.id}, product ${productId}, using payment link: ${secretName}`)

    return new Response(
      JSON.stringify({ 
        url: paymentUrl,
        product: {
          id: product.product_id,
          name: product.product_name,
          price: product.price_amount,
          currency: product.currency,
          credits: product.credits_amount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Checkout session creation error:', error)
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
