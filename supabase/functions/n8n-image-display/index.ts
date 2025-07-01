
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

    const { post_id, variation_number, image_data } = body;

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

    // Store the image in the database for persistence and history
    const { error: insertError } = await supabaseClient
      .from('linkedin_post_images')
      .upsert({
        post_id: post_id,
        variation_number: variation_number,
        image_data: image_data
      }, {
        onConflict: 'post_id,variation_number',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error storing image in database:', insertError);
      // Continue with broadcast even if database storage fails
    }

    // Create a real-time notification payload
    const notificationPayload = {
      type: 'linkedin_image_ready',
      post_id: post_id,
      variation_number: variation_number,
      image_data: image_data,
      timestamp: new Date().toISOString()
    };

    // Send real-time notification to the specific channel
    const channelName = `linkedin-image-display-${post_id}-${variation_number}`;
    
    const { error: broadcastError } = await supabaseClient
      .channel(channelName)
      .send({
        type: 'broadcast',
        event: 'image_ready',
        payload: notificationPayload
      });

    if (broadcastError) {
      console.error('Error sending broadcast:', broadcastError);
    } else {
      console.log(`Sent real-time notification to channel: ${channelName}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image display notification sent successfully',
        channel: channelName,
        stored_in_db: !insertError
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
