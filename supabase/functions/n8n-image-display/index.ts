
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
    console.log('Image Display webhook called with:', JSON.stringify(body, null, 2));

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

    // Use upsert to replace existing image atomically - this prevents duplicates
    const { data: upsertData, error: upsertError } = await supabaseClient
      .from('linkedin_post_images')
      .upsert({
        post_id: post_id,
        variation_number: variation_number,
        image_data: image_data
      }, {
        onConflict: 'post_id,variation_number',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      console.error('Error upserting image in database:', upsertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store image in database',
          details: upsertError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully upserted image in database:', upsertData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image stored successfully',
        stored_in_db: true,
        record_id: upsertData?.[0]?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in image display handler:', error);
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
