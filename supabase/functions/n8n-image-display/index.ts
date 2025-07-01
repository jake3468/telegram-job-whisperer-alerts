
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('N8N Image Display webhook called with:', JSON.stringify(body, null, 2));

    const { post_id, variation_number, image_data, user_name } = body;

    if (!post_id || !variation_number || !image_data) {
      console.error('Missing required parameters: post_id, variation_number, or image_data');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'post_id, variation_number, and image_data are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing image display for post ${post_id}, variation ${variation_number}`);

    // First, update the existing 'generating...' record with the actual image data
    const { data: updateResult, error: updateError } = await supabaseClient
      .from('linkedin_post_images')
      .update({ 
        image_data: image_data 
      })
      .eq('post_id', post_id)
      .eq('variation_number', variation_number)
      .eq('image_data', 'generating...')
      .select();

    if (updateError) {
      console.error('Error updating existing record:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update existing record: ' + updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if we actually updated a record
    if (!updateResult || updateResult.length === 0) {
      console.log('No existing generating record found, creating new record');
      
      // If no existing record was found, create a new one
      const { data: insertResult, error: insertError } = await supabaseClient
        .from('linkedin_post_images')
        .insert({
          post_id: post_id,
          variation_number: variation_number,
          image_data: image_data
        })
        .select();

      if (insertError) {
        console.error('Error creating new record:', insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create new record: ' + insertError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Created new record:', insertResult);
    } else {
      console.log('Updated existing record:', updateResult);
    }

    // Create a real-time notification payload
    const notificationPayload = {
      type: 'linkedin_image_ready',
      post_id: post_id,
      variation_number: variation_number,
      image_data: image_data,
      user_name: user_name || 'User',
      timestamp: new Date().toISOString(),
      updated_existing: updateResult && updateResult.length > 0
    };

    // Send real-time notification to the specific channel
    const channelName = `linkedin-image-display-${post_id}-${variation_number}`;
    
    await supabaseClient
      .channel(channelName)
      .send({
        type: 'broadcast',
        event: 'image_ready',
        payload: notificationPayload
      });

    console.log(`Sent real-time notification to channel: ${channelName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image processed and updated successfully',
        channel: channelName,
        updated_existing: updateResult && updateResult.length > 0,
        payload: notificationPayload
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in n8n-image-display:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
