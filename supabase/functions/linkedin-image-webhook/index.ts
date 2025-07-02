
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
    console.log('LinkedIn image webhook called');

    // Parse request body
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));

    // Extract data - handle both frontend and database trigger formats
    let post_id, variation_number, post_heading, post_content, user_name, image_data;
    
    // Handle N8N response format (with image_data)
    if (requestBody.image_data) {
      post_id = requestBody.post_id;
      variation_number = requestBody.variation_number;
      image_data = requestBody.image_data;
      console.log('Processing N8N response with image data');
    }
    // Handle frontend format
    else if (requestBody.post_heading && requestBody.post_content) {
      post_id = requestBody.post_id;
      variation_number = requestBody.variation_number;
      post_heading = requestBody.post_heading;
      post_content = requestBody.post_content;
      user_name = requestBody.user_name || 'Professional User';
      console.log('Processing frontend request');
    }
    // Handle database trigger format (with post_heading_1, etc.)
    else {
      post_id = requestBody.post_id;
      variation_number = requestBody.variation_number || 1;
      post_heading = requestBody[`post_heading_${variation_number}`] || requestBody.post_heading_1;
      post_content = requestBody[`post_content_${variation_number}`] || requestBody.post_content_1;
      user_name = requestBody.user_name || 'Professional User';
      console.log('Processing database trigger format');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!post_id || !variation_number) {
      console.error('Missing required parameters:', { post_id, variation_number });
      return new Response(
        JSON.stringify({ success: false, error: 'post_id and variation_number are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Handle N8N response with image data
    if (image_data) {
      console.log('Processing N8N response with image data');
      
      // Validate image data format
      const isValidImageData = image_data && 
                               typeof image_data === 'string' && 
                               (image_data.startsWith('data:image/') || image_data.startsWith('http')) &&
                               image_data.length > 100;

      if (isValidImageData) {
        // Save image data to database
        const { error: updateError } = await supabase
          .from('linkedin_post_images')
          .upsert({ 
            post_id: post_id,
            variation_number: variation_number,
            image_data: image_data,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'post_id,variation_number',
            ignoreDuplicates: false
          });

        if (updateError) {
          console.error('Error saving image data:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to save image data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        console.log('Successfully saved N8N image data');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Image processed and stored successfully',
            variation_number: variation_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Invalid image data in N8N response');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid image data format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Handle image generation request (create "generating..." record and call N8N)
    
    // First, set the record to "generating..." state
    const { error: insertError } = await supabase
      .from('linkedin_post_images')
      .upsert({ 
        post_id: post_id,
        variation_number: variation_number,
        image_data: 'generating...',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'post_id,variation_number',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error setting generating state:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to initialize image generation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get post data if not provided
    if (!post_heading || !post_content) {
      console.log('Fetching post data from database');
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
        // Update to failed state
        await supabase
          .from('linkedin_post_images')
          .update({ 
            image_data: 'failed - post data not found',
            updated_at: new Date().toISOString()
          })
          .eq('post_id', post_id)
          .eq('variation_number', variation_number);
          
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch post data' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      post_heading = postData[`post_heading_${variation_number}`];
      post_content = postData[`post_content_${variation_number}`];
      const user = postData.user_profile?.users;
      user_name = user ? `${user.first_name} ${user.last_name}` : 'Professional User';
    }

    // Get N8N webhook URL
    const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N webhook URL not configured');
      // Update to failed state
      await supabase
        .from('linkedin_post_images')
        .update({ 
          image_data: 'failed - webhook URL not configured',
          updated_at: new Date().toISOString()
        })
        .eq('post_id', post_id)
        .eq('variation_number', variation_number);
        
      return new Response(
        JSON.stringify({ success: false, error: 'N8N webhook URL not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Call N8N webhook
    try {
      console.log('Calling N8N webhook for image generation');
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_heading: post_heading,
          post_content: post_content,
          variation_number: variation_number,
          user_name: user_name,
          post_id: post_id,
          timestamp: new Date().toISOString()
        }),
      });

      const responseText = await response.text();
      console.log('N8N webhook response:', { 
        status: response.status, 
        statusText: response.statusText,
        body: responseText.substring(0, 200)
      });

      if (response.ok) {
        console.log('N8N webhook triggered successfully');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Image generation triggered successfully',
            variation_number: variation_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`N8N webhook failed: ${response.status} ${response.statusText}`);
        // Update to failed state
        await supabase
          .from('linkedin_post_images')
          .update({ 
            image_data: `failed - webhook error: ${response.status}`,
            updated_at: new Date().toISOString()
          })
          .eq('post_id', post_id)
          .eq('variation_number', variation_number);
          
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `N8N webhook failed: ${response.statusText}`,
            status_code: response.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

    } catch (fetchError) {
      console.error('Error calling N8N webhook:', fetchError);
      // Update to failed state
      await supabase
        .from('linkedin_post_images')
        .update({ 
          image_data: `failed - fetch error: ${fetchError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('post_id', post_id)
        .eq('variation_number', variation_number);
        
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to call N8N webhook: ${fetchError.message}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Top-level error in linkedin-image-webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
