
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

    // Get the secure payment URLs from Supabase secrets
    const { data: secretsData, error: secretsError } = await supabase
      .from('vault.decrypted_secrets')
      .select('name, decrypted_secret')
      .in('name', ['DODOPAYMENTS_BASE_URL', 'DODOPAYMENTS_REDIRECT_URL'])

    if (secretsError || !secretsData || secretsData.length === 0) {
      console.error('Error fetching payment secrets:', secretsError)
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const secrets = Object.fromEntries(
      secretsData.map(secret => [secret.name, secret.decrypted_secret])
    )

    const baseUrl = secrets.DODOPAYMENTS_BASE_URL || 'https://test.checkout.dodopayments.com/buy/'
    const redirectUrl = secrets.DODOPAYMENTS_REDIRECT_URL || 'https://preview--telegram-job-whisperer-alerts.lovable.app/get-more-credits'

    // Generate the checkout URL
    const checkoutUrl = `${baseUrl}${productId}?quantity=1&redirect_url=${encodeURIComponent(redirectUrl)}`

    // Log the checkout session creation
    console.log(`Checkout session created for user ${user.id}, product ${productId}`)

    return new Response(
      JSON.stringify({ 
        url: checkoutUrl,
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
