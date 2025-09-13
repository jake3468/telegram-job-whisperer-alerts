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
    logStep("Function started - v2.1"); // Force redeploy trigger

    // Initialize Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const clerkToken = authHeader.replace("Bearer ", "");
    logStep("Processing Clerk JWT token", { tokenLength: clerkToken.length });

    // Decode Clerk JWT to get user ID
    let clerkUserId;
    try {
      const tokenParts = clerkToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error("Malformed JWT token");
      }
      const payload = JSON.parse(atob(tokenParts[1]));
      clerkUserId = payload.sub;
      logStep("Decoded Clerk user ID", { clerkUserId, tokenType: payload.iss });
    } catch (err) {
      logStep("JWT decode error", { error: err.message, tokenLength: clerkToken.length });
      throw new Error(`Invalid Clerk JWT token: ${err.message}`);
    }

    if (!clerkUserId) {
      throw new Error("Clerk user ID not found in token");
    }

    // Get user details from our users table using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      logStep("User not found in database", { clerkUserId, error: userError });
      throw new Error("User not found. Please ensure your account is properly set up.");
    }

    logStep("User found", { userId: user.id, email: user.email });

    // Get user profile to fetch referral_id
    const { data: userProfile, error: profileError } = await supabaseService
      .from('user_profile')
      .select('referral_id')
      .eq('user_id', user.id)
      .single();

    const referralId = userProfile?.referral_id;
    if (referralId) {
      logStep("User has referral ID", { referralId });
    }

    const requestBody = await req.json();
    logStep("Request body received", { body: requestBody });
    
    // Handle both productId (from credit system) and product_id (from AI interview system)
    const product_id = requestBody.productId || requestBody.product_id;
    
    if (!product_id) {
      logStep("Missing product ID", { requestBody });
      throw new Error("Product ID is required");
    }

    logStep("Product ID received", { product_id });

    // Get product details from payment_products table
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

    // User details already available from the earlier query
    const userDetails = user;

    // Determine the payment link secret name based on product details
    const { credits_amount, currency_code, product_name, product_type } = product;
    
    // Generate secret name based on product type
    let secretName;
    if (product_name && product_name.includes('AI Mock Interview')) {
      // AI Interview products use credits-based naming
      secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_${credits_amount}_CREDITS`;
    } else {
      // General credit products use tier-based naming
      const productNameLower = product_name.toLowerCase();
      
      if (productNameLower.includes('starter')) {
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_STARTER`;
      } else if (productNameLower.includes('lite')) {
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_LITE`;
      } else if (productNameLower.includes('pro')) {
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_PRO`;
      } else if (productNameLower.includes('max')) {
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_MAX`;
      } else if (productNameLower.includes('monthly subscription')) {
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_MONTHLY_SUBSCRIPTION`;
      } else {
        // Fallback: log warning and use a safe default
        logStep("WARNING: Unknown product name pattern, using fallback", { product_name });
        secretName = `PAYMENT_LINK_${currency_code.toUpperCase()}_UNKNOWN`;
      }
    }
    
    logStep("Looking for payment link", { secretName, product_name, product_type });

    // Get payment URL directly from Edge Functions secrets
    logStep("Getting payment link from Edge Functions secrets", { secretName });
    
    // Add comprehensive debugging for secret access
    const allEnvKeys = Object.keys(Deno.env.toObject()).filter(key => key.startsWith('PAYMENT_LINK_'));
    logStep("Available payment link secrets", { 
      allSecrets: allEnvKeys, 
      secretName,
      lookingFor: secretName 
    });
    
    let paymentUrl = Deno.env.get(secretName);
    logStep("Secret retrieval result", { 
      secretName, 
      found: !!paymentUrl, 
      valueLength: paymentUrl ? paymentUrl.length : 0,
      valuePreview: paymentUrl ? paymentUrl.substring(0, 30) + "..." : "null"
    });

    if (!paymentUrl) {
      logStep("Payment link secret not found", { 
        secretName,
        availableSecrets: allEnvKeys,
        exactMatch: allEnvKeys.includes(secretName)
      });
      throw new Error(`Payment configuration missing for secret: ${secretName}. Available secrets: ${allEnvKeys.join(', ')}`);
    }
    logStep("Payment URL retrieved successfully", { paymentUrl: paymentUrl.substring(0, 50) + "..." });

    // Add user data to payment URL if available
    const urlObj = new URL(paymentUrl);
    
    // Construct full name from first_name and last_name, handling null values
    let fullName = '';
    if (userDetails.first_name && userDetails.last_name) {
      fullName = `${userDetails.first_name} ${userDetails.last_name}`;
    } else if (userDetails.first_name) {
      fullName = userDetails.first_name;
    } else if (userDetails.last_name) {
      fullName = userDetails.last_name;
    }
    
    // Add fullName parameter only if we have a name
    if (fullName) {
      urlObj.searchParams.set('fullName', fullName);
    }
    
    // Add email parameter
    if (userDetails.email) {
      urlObj.searchParams.set('email', userDetails.email);
    }
    
    // Add referral ID as metadata if available
    if (referralId) {
      urlObj.searchParams.set('metadata[affonso_referral]', referralId);
      logStep("Added referral ID to payment URL", { referralId });
    }
    
    paymentUrl = urlObj.toString();
    logStep("Payment URL with user data", { fullName: fullName || 'none', email: userDetails.email });

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
    logStep("ERROR in create-checkout-session", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return more specific error for debugging
    const responseError = {
      error: errorMessage,
      code: 500,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(responseError), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});