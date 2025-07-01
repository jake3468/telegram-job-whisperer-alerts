
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

    // First check if ANY record exists for this post_id + variation_number combination
    const { data: existingRecords, error: checkError } = await supabaseClient
      .from('linkedin_post_images')
      .select('id, image_data')
      .eq('post_id', post_id)
      .eq('variation_number', variation_number)
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('Error checking existing records:', checkError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to check existing records: ' + checkError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let updateResult = null;
    let insertResult = null;

    if (existingRecords && existingRecords.length > 0) {
      // If records exist, update the first one and delete any extras
      console.log(`Found ${existingRecords.length} existing records, updating the first one`);
      
      const recordToUpdate = existingRecords[0];
      
      // Update the first record with the new image data
      const { data: updated, error: updateError } = await supabaseClient
        .from('linkedin_post_images')
        .update({ image_data: image_data })
        .eq('id', recordToUpdate.id)
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

      updateResult = updated;

      // If there are multiple records, delete the extras
      if (existingRecords.length > 1) {
        const extraRecordIds = existingRecords.slice(1).map(r => r.id);
        console.log(`Deleting ${extraRecordIds.length} duplicate records`);
        
        const { error: deleteError } = await supabaseClient
          .from('linkedin_post_images')
          .delete()
          .in('id', extraRecordIds);

        if (deleteError) {
          console.error('Error deleting duplicate records:', deleteError);
          // Don't fail the whole operation, just log the error
        } else {
          console.log(`Successfully deleted ${extraRecordIds.length} duplicate records`);
        }
      }

      console.log('Updated existing record:', updateResult);
    } else {
      // No existing record found, create a new one
      console.log('No existing record found, creating new record');
      
      const { data: inserted, error: insertError } = await supabaseClient
        .from('linkedin_post_images')
        .insert({
          post_id: post_id,
          variation_number: variation_number,
          image_data: image_data
        })
        .select();

      if (insertError) {
        // Check if it's a unique constraint violation (duplicate)
        if (insertError.code === '23505') {
          console.log('Unique constraint violation, record was created by another process. Attempting update instead.');
          
          // Try to update the record that was just created
          const { data: updated, error: updateError } = await supabaseClient
            .from('linkedin_post_images')
            .update({ image_data: image_data })
            .eq('post_id', post_id)
            .eq('variation_number', variation_number)
            .select();

          if (updateError) {
            console.error('Error updating after constraint violation:', updateError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: 'Failed to handle duplicate record: ' + updateError.message 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          updateResult = updated;
          console.log('Successfully updated record after constraint violation');
        } else {
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
      } else {
        insertResult = inserted;
        console.log('Created new record:', insertResult);
      }
    }

    // Create a real-time notification payload
    const notificationPayload = {
      type: 'linkedin_image_ready',
      post_id: post_id,
      variation_number: variation_number,
      image_data: image_data,
      user_name: user_name || 'User',
      timestamp: new Date().toISOString(),
      updated_existing: !!updateResult
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
        updated_existing: !!updateResult,
        created_new: !!insertResult,
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
