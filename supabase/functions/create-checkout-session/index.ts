
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
    
    console.log('🚀 CHECKOUT SESSION: Received request for productId:', productId)
    
    if (!productId) {
      console.error('❌ CHECKOUT SESSION: No productId provided')
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key for vault access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ CHECKOUT SESSION: No valid authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract and decode the Clerk JWT directly
    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 CHECKOUT SESSION: Processing Clerk JWT token')
    
    let clerkUserId: string;
    try {
      // Decode JWT payload directly
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }
      
      // Decode the payload (second part)
      const payload = parts[1]
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
      const decodedString = atob(paddedPayload)
      const claims = JSON.parse(decodedString)
      
      clerkUserId = claims.sub
      if (!clerkUserId) {
        throw new Error('No user ID in JWT')
      }
      
      console.log('✅ CHECKOUT SESSION: Extracted Clerk user ID:', clerkUserId)
    } catch (error) {
      console.error('❌ CHECKOUT SESSION: JWT decode error:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JWT token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user exists in our database using the Clerk ID
    const { data: userData, error: userLookupError } = await supabase
      .from('users')
      .select('id, clerk_id, email, first_name, last_name')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userLookupError || !userData) {
      console.error('❌ CHECKOUT SESSION: User not found in database:', userLookupError?.message)
      return new Response(
        JSON.stringify({ error: 'User not found', details: userLookupError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ CHECKOUT SESSION: User authenticated successfully:', userData.id)

    // Get product details from database using service role
    console.log('🔍 CHECKOUT SESSION: Querying product details for:', productId)
    const { data: product, error: productError } = await supabase
      .from('payment_products')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      console.error('❌ CHECKOUT SESSION: Product not found:', productId, productError)
      return new Response(
        JSON.stringify({ 
          error: 'Product not found',
          details: `Product ${productId} not found or inactive`
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ CHECKOUT SESSION: Product found:', product.product_name, product.product_type, product.currency)

    // Determine the secret name based on product details
    let secretName = ''
    
    if (product.product_type === 'subscription') {
      if (product.currency === 'INR') {
        secretName = 'PAYMENT_LINK_INR_MONTHLY_SUBSCRIPTION'
      } else {
        secretName = 'PAYMENT_LINK_USD_MONTHLY_SUBSCRIPTION'
      }
    } else {
      // Credit packs
      const creditAmount = product.credits_amount
      const currency = product.currency
      
      if (currency === 'INR') {
        switch (creditAmount) {
          case 30:
            secretName = 'PAYMENT_LINK_INR_STARTER'
            break
          case 80:
            secretName = 'PAYMENT_LINK_INR_LITE'
            break
          case 200:
            secretName = 'PAYMENT_LINK_INR_PRO'
            break
          case 500:
            secretName = 'PAYMENT_LINK_INR_MAX'
            break
          default:
            secretName = `PAYMENT_LINK_INR_${creditAmount}_CREDITS`
        }
      } else {
        switch (creditAmount) {
          case 30:
            secretName = 'PAYMENT_LINK_USD_STARTER'
            break
          case 80:
            secretName = 'PAYMENT_LINK_USD_LITE'
            break
          case 200:
            secretName = 'PAYMENT_LINK_USD_PRO'
            break
          case 500:
            secretName = 'PAYMENT_LINK_USD_MAX'
            break
          default:
            secretName = `PAYMENT_LINK_USD_${creditAmount}_CREDITS`
        }
      }
    }

    console.log(`🔐 CHECKOUT SESSION: Looking for payment link with secret name: ${secretName}`)

    // Get the payment link from environment variables
    const paymentUrl = Deno.env.get(secretName)

    if (!paymentUrl) {
      console.error('❌ CHECKOUT SESSION: Payment link not found for secret:', secretName)
      
      return new Response(
        JSON.stringify({ 
          error: 'Payment link not configured',
          details: `Missing payment link for product: ${product.product_name}. Expected secret name: ${secretName}. Please configure this secret in Edge Functions Secrets.`,
          secretName: secretName,
          productDetails: {
            id: product.product_id,
            type: product.product_type,
            credits: product.credits_amount,
            currency: product.currency,
            name: product.product_name
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ CHECKOUT SESSION: Successfully retrieved payment link for: ${secretName}`)

    // Prepare dynamic URL parameters
    const firstName = userData.first_name || ''
    const lastName = userData.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    const email = userData.email || ''

    // URL encode the parameters properly
    const encodedFullName = encodeURIComponent(fullName)
    const encodedEmail = encodeURIComponent(email)

    // Add dynamic parameters to the payment URL
    let finalPaymentUrl = paymentUrl
    
    // Check if URL already has parameters
    const separator = paymentUrl.includes('?') ? '&' : '?'
    
    // Add the dynamic parameters (only if they have actual content)
    if (fullName && fullName.length > 0) {
      finalPaymentUrl += `${separator}fullName=${encodedFullName}`
    }
    
    if (email && email.length > 0) {
      const emailSeparator = (paymentUrl.includes('?') || (fullName && fullName.length > 0)) ? '&' : '?'
      finalPaymentUrl += `${emailSeparator}email=${encodedEmail}`
    }

    console.log(`🎯 CHECKOUT SESSION: Final payment URL with dynamic parameters prepared`)

    // Log the checkout session creation
    console.log(`🎉 CHECKOUT SESSION: Session created for user ${userData.id}, product ${productId}`)

    return new Response(
      JSON.stringify({ 
        url: finalPaymentUrl,
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
    console.error('💥 CHECKOUT SESSION: Unexpected error:', error)
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
