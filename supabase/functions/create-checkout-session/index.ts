import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const requestBody = await req.json();
    // Handle both productId (from credit system) and product_id (from AI interview system)
    const product_id = requestBody.product_id || requestBody.productId;
    if (!product_id) {
      throw new Error("Product ID is required");
    }

    logStep("Product ID received", { product_id });

    // Get product details from payment_products table using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: product, error: productError } = await supabaseService
      .from('payment_products')
      .select('*')
      .eq('product_id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      logStep("Product not found", { product_id, error: productError });
      throw new Error("Product not found");
    }

    logStep("Product found", { product });

    // Get user details for pre-filling payment form
    const { data: userDetails, error: userDetailsError } = await supabaseService
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (userDetailsError) {
      logStep("Could not fetch user details", { error: userDetailsError });
    }

    // Determine the payment link secret name based on product details
    const { credits_amount, currency_code } = product;
    const secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_${credits_amount}_CREDITS`;
    
    logStep("Looking for payment link", { secretName });

    // Get payment URL from Supabase secrets
    const { data: secrets, error: secretError } = await supabaseService
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('name', secretName)
      .single();

    if (secretError || !secrets?.decrypted_secret) {
      logStep("Payment link not found", { secretName, error: secretError });
      throw new Error(`Payment configuration missing. Please contact support for ${credits_amount} credits in ${currency_code}.`);
    }

    let paymentUrl = secrets.decrypted_secret;
    logStep("Payment URL retrieved", { paymentUrl: paymentUrl.substring(0, 50) + "..." });

    // Add user data to payment URL if available
    if (userDetails && (userDetails.first_name || userDetails.last_name)) {
      const fullName = `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim();
      
      // Add query parameters for pre-filling
      const urlObj = new URL(paymentUrl);
      if (fullName) {
        urlObj.searchParams.set('prefill_name', fullName);
      }
      if (userDetails.email) {
        urlObj.searchParams.set('prefill_email', userDetails.email);
      }
      
      paymentUrl = urlObj.toString();
      logStep("Payment URL with user data", { fullName, email: userDetails.email });
    }

    return new Response(JSON.stringify({ 
      url: paymentUrl,
      product: {
        name: product.product_name,
        credits: product.credits_amount,
        price: product.price_amount,
        currency: product.currency_code
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout-session", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Failed to create checkout session"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});