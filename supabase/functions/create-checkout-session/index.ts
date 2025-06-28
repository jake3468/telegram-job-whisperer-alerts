
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to decode JWT and extract user ID
function extractClerkUserIdFromJWT(token: string): string | null {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ CHECKOUT SESSION: Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    try {
      const decodedBytes = Uint8Array.from(atob(paddedPayload), c => c.charCodeAt(0));
      const decodedString = new TextDecoder().decode(decodedBytes);
      const claims = JSON.parse(decodedString);
      
      console.log('🔍 CHECKOUT SESSION: JWT Claims extracted successfully');
      console.log('🔍 CHECKOUT SESSION: Claims object:', JSON.stringify(claims, null, 2));
      
      // Try different possible user ID fields in Clerk tokens
      const userId = claims.sub || claims.user_id || claims.id;
      console.log('🔍 CHECKOUT SESSION: Extracted user ID:', userId);
      
      return userId || null;
    } catch (decodeError) {
      console.error('❌ CHECKOUT SESSION: Failed to decode JWT payload:', decodeError);
      return null;
    }
  } catch (error) {
    console.error('❌ CHECKOUT SESSION: Error extracting user ID from JWT:', error);
    return null;
  }
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

    // Get user from auth header with improved error handling
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ CHECKOUT SESSION: No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 CHECKOUT SESSION: Processing authentication token')
    console.log('🔐 CHECKOUT SESSION: Token length:', token.length)
    console.log('🔐 CHECKOUT SESSION: Token prefix:', token.substring(0, 20) + '...')
    
    // Extract Clerk user ID from JWT token
    const clerkUserId = extractClerkUserIdFromJWT(token)
    
    if (!clerkUserId) {
      console.error('❌ CHECKOUT SESSION: Failed to extract user ID from JWT token')
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 CHECKOUT SESSION: Extracted Clerk user ID:', clerkUserId)

    // Verify user exists in our database using the extracted Clerk ID
    const { data: userData, error: userLookupError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
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

    // Get the payment link from vault using service role
    const { data: secretData, error: secretError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', secretName)
      .single()

    if (secretError || !secretData?.decrypted_secret) {
      console.error('❌ CHECKOUT SESSION: Payment link not found for secret:', secretName, secretError)
      
      return new Response(
        JSON.stringify({ 
          error: 'Payment link not configured',
          details: `Missing payment link for product: ${product.product_name}. Expected secret name: ${secretName}. Please configure this secret in Supabase Vault.`,
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

    const paymentUrl = secretData.decrypted_secret
    console.log(`✅ CHECKOUT SESSION: Successfully retrieved payment link for: ${secretName}`)

    // Log the checkout session creation
    console.log(`🎉 CHECKOUT SESSION: Session created for user ${userData.id}, product ${productId}`)

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
