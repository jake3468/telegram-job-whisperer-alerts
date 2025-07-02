import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-source',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== LinkedIn Image Webhook Started ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    // Parse request body with detailed error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw body text:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check for required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasN8nUrl: !!n8nWebhookUrl,
      n8nUrl: n8nWebhookUrl ? n8nWebhookUrl.substring(0, 50) + '...' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error - missing Supabase config' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract data from request - handle multiple formats
    let post_id = requestBody.post_id;
    let variation_number = requestBody.variation_number;
    let image_data = requestBody.image_data;
    let post_heading = requestBody.post_heading;
    let post_content = requestBody.post_content;
    let user_name = requestBody.user_name;

    console.log('Extracted initial data:', {
      post_id,
      variation_number,
      hasImageData: !!image_data,
      hasPostHeading: !!post_heading,
      hasPostContent: !!post_content,
      user_name
    });

    // Validate basic required fields
    if (!post_id) {
      console.error('Missing post_id');
      return new Response(
        JSON.stringify({ success: false, error: 'post_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!variation_number) {
      variation_number = 1; // Default to 1
      console.log('No variation_number provided, defaulting to 1');
    }

    // Handle N8N response (when image_data is provided)
    if (image_data) {
      console.log('Processing N8N response with image data');
      
      try {
        const { error: updateError } = await supabase
          .from('linkedin_post_images')
          .upsert({ 
            post_id: post_id,
            variation_number: variation_number,
            image_data: image_data,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'post_id,variation_number'
          });

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to save image data', details: updateError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        console.log('Successfully saved image data to database');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Image processed and stored successfully',
            variation_number: variation_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        return new Response(
          JSON.stringify({ success: false, error: 'Database operation failed', details: dbError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Handle image generation request (no image_data provided)
    console.log('Processing image generation request');

    // If no N8N URL configured, skip N8N call and just set generating state
    if (!n8nWebhookUrl) {
      console.log('No N8N webhook URL configured, setting generating state only');
      
      try {
        const { error: insertError } = await supabase
          .from('linkedin_post_images')
          .upsert({ 
            post_id: post_id,
            variation_number: variation_number,
            image_data: 'generating...',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'post_id,variation_number'
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to set generating state', details: insertError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Image generation state set (N8N not configured)',
            variation_number: variation_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error setting generating state:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to set generating state', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Set generating state in database
    try {
      const { error: insertError } = await supabase
        .from('linkedin_post_images')
        .upsert({ 
          post_id: post_id,
          variation_number: variation_number,
          image_data: 'generating...',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'post_id,variation_number'
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to set generating state', details: insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Set generating state in database');
    } catch (error) {
      console.error('Error setting generating state:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to set generating state', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get post data if not provided
    if (!post_heading || !post_content) {
      console.log('Fetching post data from database');
      try {
        const { data: postData, error: postError } = await supabase
          .from('job_linkedin')
          .select(`
            post_heading_${variation_number},
            post_content_${variation_number},
            user_profile!inner(
              users!inner(first_name, last_name)
            )
          `)
          .eq('id', post_id)
          .single();

        if (postError) {
          console.error('Error fetching post data:', postError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch post data', details: postError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        post_heading = postData[`post_heading_${variation_number}`];
        post_content = postData[`post_content_${variation_number}`];
        const user = postData.user_profile?.users;
        user_name = user ? `${user.first_name} ${user.last_name}` : 'Professional User';
        
        console.log('Fetched post data:', {
          hasHeading: !!post_heading,
          hasContent: !!post_content,
          user_name
        });
      } catch (error) {
        console.error('Error fetching post data:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch post data', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Call N8N webhook
    try {
      console.log('Calling N8N webhook:', n8nWebhookUrl);
      
      const n8nPayload = {
        post_heading: post_heading,
        post_content: post_content,
        variation_number: variation_number,
        user_name: user_name || 'Professional User',
        post_id: post_id,
        timestamp: new Date().toISOString()
      };
      
      console.log('N8N payload:', n8nPayload);

      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(n8nPayload),
      });

      const responseText = await response.text();
      console.log('N8N response:', { 
        status: response.status, 
        statusText: response.statusText,
        body: responseText
      });

      if (!response.ok) {
        console.error(`N8N webhook failed: ${response.status} ${response.statusText}`);
        
        // Update database with failure
        try {
          await supabase
            .from('linkedin_post_images')
            .update({ 
              image_data: `failed - webhook error: ${response.status}`,
              updated_at: new Date().toISOString()
            })
            .eq('post_id', post_id)
            .eq('variation_number', variation_number);
        } catch (updateError) {
          console.error('Failed to update failure state:', updateError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `N8N webhook failed: ${response.statusText}`,
            status_code: response.status,
            response_body: responseText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('N8N webhook call successful');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Image generation triggered successfully',
          variation_number: variation_number,
          n8n_response: responseText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      console.error('Error calling N8N webhook:', fetchError);
      
      // Update database with failure
      try {
        await supabase
          .from('linkedin_post_images')
          .update({ 
            image_data: `failed - fetch error: ${fetchError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('post_id', post_id)
          .eq('variation_number', variation_number);
      } catch (updateError) {
        console.error('Failed to update failure state:', updateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to call N8N webhook: ${fetchError.message}`,
          details: fetchError.toString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Top-level error in linkedin-image-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});