import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import LinkedInPostDisplay from './LinkedInPostDisplay';
import { useN8NImageDisplay } from '@/hooks/useN8NImageDisplay';
import { logger } from '@/utils/logger';

interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  created_at: string | null;
}

interface UserData {
  first_name: string | null;
  last_name: string | null;
}

interface LinkedInPostVariationProps {
  heading: string;
  content: string;
  userProfile?: UserProfile | null;
  userData?: UserData | null;
  variationNumber: number;
  postId?: string;
}

const LinkedInPostVariation = ({
  heading,
  content,
  userProfile,
  userData,
  variationNumber,
  postId
}: LinkedInPostVariationProps) => {
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  // User-triggered loading state - only set when user clicks "Get Image"
  const [isUserLoadingImage, setIsUserLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  const [isGeneratingState, setIsGeneratingState] = useState(false);
  // Track the current generation to avoid resetting loading state prematurely
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  // Track when generation started for timestamp comparison
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);

  // Add N8N image display hook
  const { n8nImages } = useN8NImageDisplay(postId || '', variationNumber);

  // Combine both regular images and N8N images
  const allImages = [...generatedImages, ...n8nImages];

  // Helper function to check if image data is valid
  const isValidImageData = (imageData: string): boolean => {
    const isValid = imageData.startsWith('data:image/') || imageData.startsWith('http');
    console.log('🔍 Image validation check:', {
      imageDataStart: imageData.substring(0, 50),
      isValid,
      postId,
      variationNumber
    });
    return isValid;
  };

  // Function to check and load existing images
  const checkAndLoadExistingImages = useCallback(async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data, updated_at, created_at')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error loading existing images:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log('🔍 Raw image data from database:', {
            postId,
            variationNumber,
            records: data.map(img => ({
              image_data_start: img.image_data.substring(0, 50),
              image_data_length: img.image_data.length,
              is_generating: img.image_data === 'generating...',
              includes_failed: img.image_data.includes('failed'),
              is_valid: isValidImageData(img.image_data)
            }))
          });

          // Check if any record is in generating state
          const hasGeneratingRecord = data.some(img => img.image_data === 'generating...');
          
          if (hasGeneratingRecord) {
            // Always set generating state when we find a "generating..." record
            setIsGeneratingState(true);
            setImageGenerationFailed(false);
            logger.imageProcessing('found_generating_record_on_load', postId, variationNumber);
          }

          // Remove duplicates and keep only the most recent unique valid images
          const uniqueImages = data
            .filter(img => {
              const isValidImage = img.image_data.trim() && 
                                 img.image_data !== 'generating...' && 
                                 !img.image_data.includes('failed') && 
                                 isValidImageData(img.image_data);
              
              console.log('🔍 Image filter check:', {
                postId,
                variationNumber,
                image_data_start: img.image_data.substring(0, 50),
                has_trim: !!img.image_data.trim(),
                not_generating: img.image_data !== 'generating...',
                not_failed: !img.image_data.includes('failed'),
                is_valid_format: isValidImageData(img.image_data),
                final_result: isValidImage
              });

              return isValidImage;
            })
            .reduce((acc: string[], current) => {
              if (!acc.includes(current.image_data)) {
                acc.push(current.image_data);
              }
              return acc;
            }, []);

          console.log('🔍 Final processed images:', {
            postId,
            variationNumber,
            unique_images_count: uniqueImages.length,
            has_generating: hasGeneratingRecord
          });

          logger.imageProcessing('existing_images_loaded', postId, variationNumber, {
            found_count: uniqueImages.length,
            has_generating: hasGeneratingRecord
          });
          
          setGeneratedImages(uniqueImages);
        }
      }, 3, `check existing images for variation ${variationNumber}`);
    } catch (err) {
      logger.error('Error checking existing images:', err);
    }
  }, [postId, variationNumber, isAuthReady, executeWithRetry]);

  // Load existing images on component mount
  useEffect(() => {
    checkAndLoadExistingImages();
  }, [checkAndLoadExistingImages]);

  // Real-time subscription for image updates from the database
  useEffect(() => {
    if (!postId || !isAuthReady) return;

    logger.imageProcessing('realtime_setup', postId, variationNumber, {
      subscription_channel: `linkedin-image-updates-${postId}-${variationNumber}`
    });

    const channel = supabase
      .channel(`linkedin-image-updates-${postId}-${variationNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        console.log('🔍 Real-time update received:', {
          postId,
          variationNumber,
          event_type: payload.eventType,
          payload_variation: (payload.new as any)?.variation_number,
          image_data_start: (payload.new as any)?.image_data?.substring(0, 50),
          image_data_length: (payload.new as any)?.image_data?.length
        });

        logger.imageProcessing('realtime_update_received', postId, variationNumber, {
          event_type: payload.eventType,
          variation_in_payload: (payload.new as any)?.variation_number || (payload.old as any)?.variation_number,
          current_generation_id: currentGenerationId,
          has_active_generation: !!currentGenerationId,
          generation_start_time: generationStartTime?.toISOString()
        });
        
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const updatedImage = payload.new as any;
          
          // Type guard to ensure we have the required properties
          if (!updatedImage || typeof updatedImage.variation_number !== 'number') {
            logger.imageProcessing('realtime_invalid_payload', postId, variationNumber, {
              payload: payload.new
            });
            return;
          }
          
          // Check if this update is for our specific variation
          if (updatedImage.variation_number !== variationNumber) {
            logger.imageProcessing('realtime_ignored_wrong_variation', postId, variationNumber, {
              payload_variation: updatedImage.variation_number
            });
            return;
          }
          
          // Check if this is a "generating..." state - ALWAYS process this regardless of currentGenerationId
          if (updatedImage.image_data === 'generating...') {
            logger.imageProcessing('realtime_generating_state', postId, variationNumber, {
              current_generation_id: currentGenerationId,
              setting_generating_state: true
            });
            
            // Always set generating state when we receive "generating..." from database
            setIsGeneratingState(true);
            setImageGenerationFailed(false);
            return;
          }
          
          // Only process completed images (not 'generating...' or failed)
          if (updatedImage.image_data && 
              updatedImage.image_data !== 'generating...' && 
              !updatedImage.image_data.includes('failed') &&
              updatedImage.image_data.trim()) {
            
            console.log('🔍 Processing completed image:', {
              postId,
              variationNumber,
              image_data_start: updatedImage.image_data.substring(0, 50),
              image_data_length: updatedImage.image_data.length,
              is_valid_format: isValidImageData(updatedImage.image_data),
              current_generation_id: currentGenerationId
            });
            
            logger.imageProcessing('realtime_valid_image', postId, variationNumber, {
              image_type: updatedImage.image_data.substring(0, 20),
              current_generation_id: currentGenerationId,
              has_active_generation: !!currentGenerationId
            });
            
            // Enhanced validation for base64 images
            if (isValidImageData(updatedImage.image_data)) {
              logger.imageProcessing('realtime_image_accepted', postId, variationNumber, {
                was_loading: isUserLoadingImage,
                was_generating: isGeneratingState,
                generation_id: currentGenerationId,
                generation_start_time: generationStartTime?.toISOString(),
                image_created_at: updatedImage.created_at || updatedImage.updated_at
              });
              
              // Check if this is a truly new image during active generation
              const shouldResetLoadingState = currentGenerationId && (
                // Image was created/updated after generation started
                generationStartTime && 
                new Date(updatedImage.updated_at || updatedImage.created_at) > generationStartTime
              );
              
              // Update the existing image in the list (avoid duplicates)
              setGeneratedImages(prev => {
                const exists = prev.includes(updatedImage.image_data);
                if (exists) {
                  console.log('🔍 Duplicate image detected, not adding');
                  logger.imageProcessing('realtime_duplicate_image', postId, variationNumber);
                  return prev;
                }
                
                console.log('🔍 Adding new image to state:', {
                  postId,
                  variationNumber,
                  should_reset_loading: shouldResetLoadingState,
                  previous_count: prev.length
                });
                
                logger.imageProcessing('realtime_image_added', postId, variationNumber, {
                  should_reset_loading: shouldResetLoadingState
                });
                return [updatedImage.image_data, ...prev.filter(img => img !== updatedImage.image_data)];
              });
              
              // Reset loading state when we receive a new image (either from active generation or existing)
              if (shouldResetLoadingState || isGeneratingState) {
                console.log('🔍 Resetting loading state for new image');
                
                logger.imageProcessing('loading_state_reset_for_new_image', postId, variationNumber, {
                  generation_id: currentGenerationId,
                  image_timestamp: updatedImage.updated_at || updatedImage.created_at,
                  generation_start: generationStartTime?.toISOString(),
                  was_active_generation: !!currentGenerationId
                });
                
                setIsUserLoadingImage(false);
                setIsGeneratingState(false);
                setImageGenerationFailed(false);
                setCurrentGenerationId(null);
                setGenerationStartTime(null);
                
                toast({
                  title: "Image Generated!",
                  description: `LinkedIn post image for variation ${variationNumber} is ready.`
                });
              }
            } else {
              console.log('🔍 Invalid image format detected:', {
                postId,
                variationNumber,
                image_data_start: updatedImage.image_data.substring(0, 50)
              });
              
              logger.imageProcessing('realtime_invalid_image_format', postId, variationNumber, {
                image_data_start: updatedImage.image_data.substring(0, 50)
              });
              
              if (currentGenerationId || isGeneratingState) {
                setIsUserLoadingImage(false);
                setIsGeneratingState(false);
                setImageGenerationFailed(true);
                setCurrentGenerationId(null);
                setGenerationStartTime(null);
              }
            }
          } 
          else if (updatedImage.image_data && updatedImage.image_data.includes('failed')) {
            logger.imageProcessing('realtime_failed_image', postId, variationNumber, {
              failure_message: updatedImage.image_data,
              generation_id: currentGenerationId
            });
            
            if (currentGenerationId || isGeneratingState) {
              setIsUserLoadingImage(false);
              setIsGeneratingState(false);
              setImageGenerationFailed(true);
              setCurrentGenerationId(null);
              setGenerationStartTime(null);
            }
            
            toast({
              title: "Image Generation Failed",
              description: `Failed to generate image for variation ${variationNumber}. Please try again.`,
              variant: "destructive"
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old as any;
          
          // Type guard for deleted image
          if (deletedImage && typeof deletedImage.variation_number === 'number' && deletedImage.variation_number === variationNumber) {
            setGeneratedImages(prev => prev.filter(img => img !== deletedImage.image_data));
          }
        }
      })
      .subscribe((status) => {
        logger.imageProcessing('realtime_subscription_status', postId, variationNumber, {
          status: status
        });
      });

    return () => {
      logger.imageProcessing('realtime_cleanup', postId, variationNumber);
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, isAuthReady, toast, currentGenerationId, isUserLoadingImage, isGeneratingState, generationStartTime]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "The LinkedIn post has been copied to your clipboard."
      });
    } catch (err) {
      logger.error('Failed to copy text:', err);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  // Copy image to clipboard
  const copyImageToClipboard = async (imageData: string) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast({
        title: "Image copied!",
        description: "The image has been copied to your clipboard."
      });
    } catch (err) {
      logger.error('Failed to copy image: ', err);
      toast({
        title: "Copy failed",
        description: "Please try right-clicking and copying the image manually.",
        variant: "destructive"
      });
    }
  };

  // Handle image generation - User-action driven
  const handleGenerateImage = async () => {
    if (!postId) {
      toast({
        title: "Error",
        description: "Post ID not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Generate a unique ID for this generation request
    const generationId = crypto.randomUUID();
    const startTime = new Date();

    logger.imageProcessing('user_generation_trigger', postId, variationNumber, {
      current_loading_state: isUserLoadingImage,
      current_generating_state: isGeneratingState,
      has_existing_images: allImages.length > 0,
      generation_id: generationId,
      generation_start_time: startTime.toISOString()
    });
    
    // Reset any previous failure state and set loading states immediately
    setImageGenerationFailed(false);
    setIsUserLoadingImage(true);
    setIsGeneratingState(true);
    setCurrentGenerationId(generationId);
    setGenerationStartTime(startTime);

    // Set timeout to reset loading state after 3 minutes
    const timeoutId = setTimeout(() => {
      logger.imageProcessing('generation_timeout', postId, variationNumber, {
        timeout_duration: '3_minutes',
        generation_id: generationId
      });
      
      // Only reset if this timeout is for the current generation
      if (currentGenerationId === generationId) {
        setIsUserLoadingImage(false);
        setIsGeneratingState(false);
        setImageGenerationFailed(true);
        setCurrentGenerationId(null);
        setGenerationStartTime(null);
        
        toast({
          title: "Image Generation Timeout",
          description: `Image generation took too long for variation ${variationNumber}. Please try again.`,
          variant: "destructive"
        });
      }
    }, 180000);

    try {
      await executeWithRetry(async () => {
        // Step 1: CRITICAL - First delete any existing "generating..." records to avoid conflicts
        logger.imageProcessing('cleaning_generating_records', postId, variationNumber, {
          generation_id: generationId
        });
        
        await supabase
          .from('linkedin_post_images')
          .delete()
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .eq('image_data', 'generating...');

        // Step 2: Update existing valid image record to "generating..." OR create new one
        logger.imageProcessing('updating_to_generating_state', postId, variationNumber, {
          generation_id: generationId
        });
        
        // Try to update an existing valid base64 image record first
        const { data: updateResult, error: updateError } = await supabase
          .from('linkedin_post_images')
          .update({ 
            image_data: 'generating...',
            updated_at: new Date().toISOString()
          })
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .like('image_data', 'data:image/%') // Only update existing base64 images
          .select()
          .limit(1);

        logger.imageProcessing('update_attempt_result', postId, variationNumber, {
          generation_id: generationId,
          update_error: updateError?.message,
          update_result_count: updateResult?.length || 0,
          has_update_error: !!updateError
        });

        // If no existing base64 image was updated, create a new generating record
        if (!updateError && (!updateResult || updateResult.length === 0)) {
          logger.imageProcessing('creating_new_generating_record', postId, variationNumber, {
            generation_id: generationId
          });
          
          const { error: insertError } = await supabase
            .from('linkedin_post_images')
            .insert({
              post_id: postId,
              variation_number: variationNumber,
              image_data: 'generating...'
            });

          if (insertError && insertError.code !== '23505') { // Ignore unique constraint violations
            logger.error('Error creating generating record:', insertError);
            throw new Error('Failed to prepare image generation');
          }
        } else if (updateError) {
          logger.error('Error updating existing record to generating:', updateError);
          throw new Error('Failed to update existing record for regeneration');
        } else {
          logger.imageProcessing('successfully_updated_existing_record', postId, variationNumber, {
            generation_id: generationId,
            updated_records: updateResult.length
          });
        }

        // Step 3: Call edge function
        logger.imageProcessing('webhook_call_start', postId, variationNumber, {
          generation_id: generationId
        });
        const userName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 'Professional User';
        
        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('linkedin-image-webhook', {
          body: {
            post_id: postId,
            post_heading: heading,
            post_content: content,
            variation_number: variationNumber,
            user_name: userName,
            source: 'linkedin_post_variation',
            generation_id: generationId
          }
        });

        if (webhookError) {
          logger.error('Edge function error:', webhookError);
          throw new Error(`Edge function failed: ${webhookError.message}`);
        }

        logger.imageProcessing('webhook_response', postId, variationNumber, {
          ...webhookResponse,
          generation_id: generationId
        });

        if (webhookResponse && webhookResponse.success === false) {
          if (!webhookResponse.webhook_url_configured) {
            throw new Error('N8N webhook URL not configured');
          } else {
            throw new Error(webhookResponse.error || 'Edge function execution failed');
          }
        }

        logger.imageProcessing('webhook_success', postId, variationNumber, {
          generation_id: generationId
        });
        clearTimeout(timeoutId);

      }, 3, `generate image for variation ${variationNumber}`);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated via N8N..."
      });

    } catch (err: any) {
      logger.error('Error in handleGenerateImage:', err);
      clearTimeout(timeoutId);
      
      // Only reset loading state if this error is for the current generation
      if (currentGenerationId === generationId) {
        setIsUserLoadingImage(false);
        setIsGeneratingState(false);
        setImageGenerationFailed(true);
        setCurrentGenerationId(null);
        setGenerationStartTime(null);
      }
      
      let errorMessage = "Failed to generate image. Please try again.";
      if (err.message.includes('webhook URL not configured')) {
        errorMessage = "Image generation service is not configured. Please contact support.";
      } else if (err.message.includes('Edge function execution failed')) {
        errorMessage = "Image generation service is temporarily unavailable. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Delete image
  const deleteImage = async (imageData: string) => {
    if (!postId) return;

    try {
      await executeWithRetry(async () => {
        const { error } = await supabase
          .from('linkedin_post_images')
          .delete()
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .eq('image_data', imageData);

        if (error) {
          logger.error('Error deleting image:', error);
          throw error;
        }
      }, 3, `delete image for variation ${variationNumber}`);

      setGeneratedImages(prev => prev.filter(img => img !== imageData));
      
      toast({
        title: "Image Deleted",
        description: `Image for variation ${variationNumber} has been deleted.`
      });

    } catch (err) {
      logger.error('Error deleting image:', err);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Determine the actual loading state and what to show
  const isActuallyLoading = isUserLoadingImage || isGeneratingState;
  const shouldShowLoading = isActuallyLoading;
  const shouldShowFailed = imageGenerationFailed && !isActuallyLoading;

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Post Heading - Smaller and Clearer */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg mb-4">
          <h3 className="text-base font-semibold text-center break-words">
            Post Variation {variationNumber}: {heading}
          </h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => copyToClipboard(content)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 font-medium"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Post
          </Button>
          <Button
            onClick={handleGenerateImage}
            size="sm"
            disabled={isActuallyLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 px-6 py-2 font-medium"
          >
            {isActuallyLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2" />
            )}
            {isActuallyLoading ? 'Generating...' : 'Get Image'}
          </Button>
        </div>
      </div>

      {/* Loading indicator - show when user triggered loading */}
      {shouldShowLoading && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200 mb-6">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading via N8N for variation {variationNumber}...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator - only show when failed and not loading */}
      {shouldShowFailed && (
        <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200 mb-6">
          <div className="text-sm text-red-600 font-medium">Image generation failed for variation {variationNumber}</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Images - Show both regular and N8N images */}
      {allImages.length > 0 && (
        <div className="mb-8">
          <h5 className="text-cyan-400 font-medium text-sm mb-4 text-center">
            Generated Images for Variation {variationNumber} ({allImages.length}):
            {n8nImages.length > 0 && <span className="text-green-400 ml-2">✨ N8N: {n8nImages.length}</span>}
          </h5>
          <div className="space-y-6">
            {allImages.map((imageData, index) => (
              <div key={index} className="relative w-full max-w-2xl mx-auto">
                <img 
                  src={imageData} 
                  alt={`Generated LinkedIn post image ${index + 1} for variation ${variationNumber}`}
                  className="w-full rounded-lg shadow-lg object-contain"
                  onLoad={() => {
                    console.log(`🔍 Image ${index + 1} loaded successfully in UI for variation ${variationNumber}`);
                    logger.imageProcessing('image_loaded_in_ui', postId || 'unknown', variationNumber, {
                      image_index: index,
                      generation_id: currentGenerationId
                    });
                  }}
                  onError={(e) => {
                    console.log(`🔍 Image ${index + 1} failed to load in UI for variation ${variationNumber}:`, e);
                    logger.error(`Failed to load image ${index + 1} for variation ${variationNumber}`, e);
                    if (isActuallyLoading && currentGenerationId) {
                      setIsUserLoadingImage(false);
                      setIsGeneratingState(false);
                      setImageGenerationFailed(true);
                      setCurrentGenerationId(null);
                      setGenerationStartTime(null);
                    }
                  }}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    onClick={() => copyImageToClipboard(imageData)}
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white p-2 h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteImage(imageData)}
                    size="sm"
                    className="bg-red-600/70 hover:bg-red-600/80 text-white p-2 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn Post Preview */}
      <div className="w-full">
        <LinkedInPostDisplay 
          content={content}
          userProfile={userProfile}
          userData={userData}
        />
      </div>
    </div>
  );
};

export default LinkedInPostVariation;
