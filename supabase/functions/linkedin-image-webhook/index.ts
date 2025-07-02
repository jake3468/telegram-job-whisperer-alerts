
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
}

// Global cache to track ongoing requests
const activeRequests = new Map<string, Promise<Response>>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { post_heading, post_content, variation_number, user_name, post_id, source, success, image_data } = await req.json()
    
    // Generate a unique request ID for deduplication
    const requestId = req.headers.get('x-request-id') || `${post_id}-${variation_number}-${Date.now()}-${Math.random()}`
    
    console.log('LinkedIn image webhook called with:', { 
      post_id, 
      variation_number, 
      source, 
      success, 
      has_image_data: !!image_data,
      request_id: requestId,
      request_source: req.headers.get('x-source') || 'unknown'
    })

    // Check for duplicate requests
    if (activeRequests.has(`${post_id}-${variation_number}`)) {
      console.log('Duplicate request detected, waiting for active request to complete')
      return await activeRequests.get(`${post_id}-${variation_number}`)!
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // CRITICAL: Ultra-early protection check with timestamp validation
    if (post_id && variation_number) {
      console.log('Performing ultra-early protection check for existing valid image...')
      
      const { data: existingRecord, error: checkError } = await supabase
        .from('linkedin_post_images')
        .select('image_data, id, updated_at, created_at')
        .eq('post_id', post_id)
        .eq('variation_number', variation_number)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single()

      if (!checkError && existingRecord) {
        const isValidImage = existingRecord.image_data && 
                           existingRecord.image_data.startsWith('data:image/') && 
                           existingRecord.image_data.length > 100
        
        console.log('Existing record found:', {
          has_valid_image: isValidImage,
          image_data_start: existingRecord.image_data?.substring(0, 50),
          image_data_length: existingRecord.image_data?.length,
          updated_at: existingRecord.updated_at,
          record_age_minutes: existingRecord.updated_at ? 
            Math.floor((Date.now() - new Date(existingRecord.updated_at).getTime()) / (1000 * 60)) : 'unknown'
        })

        if (isValidImage) {
          console.log('PROTECTION: Valid image already exists, preventing any overwrites')
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Valid image already exists, protected from overwrite',
              record_id: existingRecord.id,
              protected: true,
              request_id: requestId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Wrap the main processing in a promise for deduplication
    const processingPromise = (async (): Promise<Response> => {
      try {
        // Check if this is a direct N8N response with image data (regardless of HTTP status)
        if (image_data && post_id && variation_number) {
          console.log('Processing potential N8N image response for post:', post_id, 'variation:', variation_number)
          
          // Validate image data format
          const isValidImageData = image_data && 
                                 typeof image_data === 'string' && 
                                 (image_data.startsWith('data:image/') || image_data.startsWith('http')) &&
                                 image_data.length > 100

          console.log('N8N Response Analysis:', {
            has_image_data: !!image_data,
            image_data_type: typeof image_data,
            is_valid_format: isValidImageData,
            image_data_start: image_data?.substring(0, 50),
            image_data_length: image_data?.length,
            success_flag: success
          })

          if (isValidImageData) {
            console.log('Valid image data detected from N8N, processing update...')
            
            // Triple-check protection before processing N8N response
            const { data: currentRecord, error: checkError } = await supabase
              .from('linkedin_post_images')
              .select('image_data, id, updated_at')
              .eq('post_id', post_id)
              .eq('variation_number', variation_number)
              .order('updated_at', { ascending: false, nullsFirst: false })
              .limit(1)
              .single()

            if (!checkError && currentRecord) {
              const hasValidImage = currentRecord.image_data?.startsWith('data:image/') && 
                                  currentRecord.image_data.length > 100
              
              if (hasValidImage) {
                console.log('PROTECTION: Valid image already exists during N8N processing, skipping update')
                return new Response(
                  JSON.stringify({ 
                    success: true, 
                    message: 'Valid image already exists, N8N update skipped to prevent overwrite',
                    record_id: currentRecord.id,
                    protected: true,
                    request_id: requestId
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }
            }

            console.log('Proceeding with N8N image update - no existing valid image found')

            // Use upsert with conflict resolution for atomic operation
            const { data: upsertResult, error: upsertError } = await supabase
              .from('linkedin_post_images')
              .upsert({ 
                post_id: post_id,
                variation_number: variation_number,
                image_data: image_data,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'post_id,variation_number',
                ignoreDuplicates: false
              })
              .select()

            if (upsertError) {
              console.error('Error upserting image record:', upsertError)
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'Failed to save image data',
                  details: upsertError.message,
                  request_id: requestId
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                  status: 500 
                }
              )
            }

            console.log('Successfully processed N8N image data')
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Image processed and stored successfully from N8N response',
                image_data_received: true,
                variation_number: variation_number,
                request_id: requestId
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            console.log('Invalid or missing image data in N8N response')
          }
        }

        // Handle regular webhook trigger (not direct N8N response)
        if (!post_id || !variation_number) {
          console.error('Missing required parameters: post_id or variation_number')
          throw new Error('post_id and variation_number are required')
        }

        // CRITICAL: Before processing webhook trigger, check if valid image already exists
        console.log('Checking for existing valid image before webhook trigger processing...')
        
        const { data: existingImageCheck, error: existingImageError } = await supabase
          .from('linkedin_post_images')
          .select('image_data, id, updated_at')
          .eq('post_id', post_id)
          .eq('variation_number', variation_number)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(1)
          .single()

        if (!existingImageError && existingImageCheck) {
          const hasValidImage = existingImageCheck.image_data?.startsWith('data:image/') && 
                               existingImageCheck.image_data.length > 100
          
          if (hasValidImage) {
            console.log('PROTECTION: Valid image already exists for this post/variation, skipping webhook trigger')
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Valid image already exists, webhook trigger skipped to prevent overwrite',
                record_id: existingImageCheck.id,
                protected: true,
                request_id: requestId
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // Get the post data to extract heading and content
        let postHeading = post_heading;
        let postContent = post_content;
        let userName = user_name;

        if (!postHeading || !postContent) {
          console.log('Missing post data, fetching from database...')
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
            .single()

          if (postError) {
            console.error('Error fetching post data:', postError)
            throw new Error('Failed to fetch post data')
          }

          postHeading = postData[`post_heading_${variation_number}`]
          postContent = postData[`post_content_${variation_number}`]
          const user = postData.user_profile?.users
          userName = user ? `${user.first_name} ${user.last_name}` : 'Professional User'
        }

        // Get the N8N webhook URL from environment variables
        const n8nWebhookUrl = Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')

        if (!n8nWebhookUrl) {
          console.error('N8N_LINKEDIN_IMAGE_WEBHOOK_URL environment variable not found')
          
          // Only update to failed status if current record is "generating..." - NEVER overwrite valid images
          const { data: currentRecord } = await supabase
            .from('linkedin_post_images')
            .select('image_data')
            .eq('post_id', post_id)
            .eq('variation_number', variation_number)
            .single()

          if (currentRecord && currentRecord.image_data === 'generating...') {
            console.log('Safely updating generating state to failed - webhook URL not configured')
            await supabase
              .from('linkedin_post_images')
              .update({ 
                image_data: 'failed - webhook URL not configured',
                updated_at: new Date().toISOString()
              })
              .eq('post_id', post_id)
              .eq('variation_number', variation_number)
              .eq('image_data', 'generating...')  // Additional safety check
          } else {
            console.log('Skipping failure update - current state is not generating')
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'N8N webhook URL not configured in environment variables',
              webhook_url_configured: false,
              request_id: requestId
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        }

        console.log('Triggering N8N webhook with enhanced payload')

        try {
          // Call the N8N webhook with enhanced error handling
          const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Source": req.headers.get('x-source') || 'supabase-webhook',
              "X-Request-ID": requestId,
            },
            body: JSON.stringify({
              post_heading: postHeading,
              post_content: postContent,
              variation_number,
              user_name: userName,
              post_id,
              source,
              timestamp: new Date().toISOString(),
              triggered_from: req.headers.get('origin') || 'linkedin-image-webhook',
              request_id: requestId
            }),
          })

          // Parse response body FIRST, regardless of HTTP status
          let responseData = null;
          let responseText = '';
          
          try {
            responseText = await response.text()
            console.log('N8N webhook response:', { 
              status: response.status, 
              statusText: response.statusText,
              responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
              request_id: requestId
            })
            
            if (responseText.trim()) {
              responseData = JSON.parse(responseText)
            }
          } catch (parseError) {
            console.error('Failed to parse N8N response as JSON:', parseError, 'Raw response:', responseText.substring(0, 200))
          }

          // CRITICAL: Check for valid image data in response FIRST, regardless of HTTP status
          const hasValidImageInResponse = responseData && 
                                        responseData.image_data && 
                                        typeof responseData.image_data === 'string' &&
                                        (responseData.image_data.startsWith('data:image/') || responseData.image_data.startsWith('http')) &&
                                        responseData.image_data.length > 100

          console.log('N8N Response Analysis:', {
            http_status: response.status,
            has_response_data: !!responseData,
            has_image_data_field: !!(responseData?.image_data),
            image_data_valid: hasValidImageInResponse,
            success_flag: responseData?.success,
            request_id: requestId
          })

          if (hasValidImageInResponse) {
            console.log('N8N returned valid image data (ignoring HTTP status):', response.status)
            
            // Final protection check before updating with N8N response
            const { data: finalCheck } = await supabase
              .from('linkedin_post_images')
              .select('image_data, updated_at')
              .eq('post_id', post_id)
              .eq('variation_number', variation_number)
              .order('updated_at', { ascending: false, nullsFirst: false })
              .limit(1)
              .single()

            const alreadyHasValidImage = finalCheck && 
                                       finalCheck.image_data?.startsWith('data:image/') && 
                                       finalCheck.image_data.length > 100

            if (alreadyHasValidImage) {
              console.log('PROTECTION: Valid image detected during final check, aborting N8N update')
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  message: 'Valid image already exists, N8N response ignored to prevent overwrite',
                  protected: true,
                  request_id: requestId
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
            
            // Use atomic upsert operation
            const { data: updateResult, error: updateError } = await supabase
              .from('linkedin_post_images')
              .upsert({ 
                post_id: post_id,
                variation_number: variation_number,
                image_data: responseData.image_data,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'post_id,variation_number',
                ignoreDuplicates: false
              })
              .select()

            if (updateError) {
              console.error('Error updating with image data:', updateError)
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  error: 'Failed to save image data',
                  details: updateError.message,
                  request_id: requestId
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                  status: 500 
                }
              )
            }

            console.log('Successfully processed N8N webhook response with valid image data')
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Image processed and stored successfully from N8N webhook response',
                image_data_received: true,
                variation_number: variation_number,
                http_status_was: response.status,
                request_id: requestId
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          // If HTTP status is not OK AND no valid image data found, then it's a real failure
          if (!response.ok && !hasValidImageInResponse) {
            console.error(`N8N webhook failed: ${response.status} ${response.statusText}`, responseText.substring(0, 200))
            
            // Only update to failed status if current record is "generating..." - NEVER overwrite valid images
            const { data: currentRecord } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', post_id)
              .eq('variation_number', variation_number)
              .single()

            if (currentRecord && currentRecord.image_data === 'generating...') {
              console.log('Safely updating generating state to failed due to webhook error')
              await supabase
                .from('linkedin_post_images')
                .update({ 
                  image_data: `failed - webhook error: ${response.status}`,
                  updated_at: new Date().toISOString()
                })
                .eq('post_id', post_id)
                .eq('variation_number', variation_number)
                .eq('image_data', 'generating...')  // Additional safety check
            } else {
              console.log('Skipping failure update - current state is not generating, may be valid image')
            }
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `N8N webhook failed: ${response.statusText}`,
                webhook_url_configured: true,
                status_code: response.status,
                request_id: requestId
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 500 
              }
            )
          }

          // If successful HTTP response but no direct image data, return success for webhook trigger
          console.log(`N8N webhook triggered successfully for variation ${variation_number}`)
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Image generation triggered successfully',
              triggered: true,
              variation_number: variation_number,
              webhook_url_configured: true,
              request_id: requestId
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )

        } catch (fetchError) {
          console.error('Error calling N8N webhook:', fetchError)
          
          // Only update to failed status if current record is "generating..." - NEVER overwrite valid images
          const { data: currentRecord } = await supabase
            .from('linkedin_post_images')
            .select('image_data')
            .eq('post_id', post_id)
            .eq('variation_number', variation_number)
            .single()

          if (currentRecord && currentRecord.image_data === 'generating...') {
            console.log('Safely updating generating state to failed due to fetch error')
            await supabase
              .from('linkedin_post_images')
              .update({ 
                image_data: `failed - fetch error: ${fetchError.message}`,
                updated_at: new Date().toISOString()
              })
              .eq('post_id', post_id)
              .eq('variation_number', variation_number)
              .eq('image_data', 'generating...')  // Additional safety check
          } else {
            console.log('Skipping failure update due to fetch error - current state is not generating')
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to call N8N webhook: ${fetchError.message}`,
              webhook_url_configured: true,
              request_id: requestId
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        }

      } finally {
        // Remove from active requests when done
        activeRequests.delete(`${post_id}-${variation_number}`)
      }
    })()

    // Store the promise for deduplication
    if (post_id && variation_number) {
      activeRequests.set(`${post_id}-${variation_number}`, processingPromise)
    }

    return await processingPromise

  } catch (error) {
    console.error('Error in linkedin-image-webhook:', error)
    
    // Clean up active requests on error
    if (typeof post_id === 'string' && typeof variation_number === 'number') {
      activeRequests.delete(`${post_id}-${variation_number}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        webhook_url_configured: !!Deno.env.get('N8N_LINKEDIN_IMAGE_WEBHOOK_URL')
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
