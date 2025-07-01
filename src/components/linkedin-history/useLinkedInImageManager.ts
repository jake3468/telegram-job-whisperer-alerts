
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { logger } from '@/utils/logger';

interface LinkedInImageData {
  id: string;
  image_data: string;
  variation_number: number;
  created_at: string;
  updated_at?: string;
}

export function useLinkedInImageManager(postId: string | null) {
  const [images, setImages] = useState<LinkedInImageData[]>([]);
  // User-action driven loading states - only set when user clicks "Get Image"
  const [userTriggeredLoading, setUserTriggeredLoading] = useState<boolean[]>([false, false, false]);
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();

  // Transform images data to match the expected format - only show actual images
  const generatedImages = {
    1: images.filter(img => img.variation_number === 1 && img.image_data !== 'generating...' && !img.image_data.includes('failed') && img.image_data.trim()).map(img => img.image_data),
    2: images.filter(img => img.variation_number === 2 && img.image_data !== 'generating...' && !img.image_data.includes('failed') && img.image_data.trim()).map(img => img.image_data),
    3: images.filter(img => img.variation_number === 3 && img.image_data !== 'generating...' && !img.image_data.includes('failed') && img.image_data.trim()).map(img => img.image_data)
  };

  // Loading state is now purely user-action driven
  const loadingImage = {
    1: userTriggeredLoading[0],
    2: userTriggeredLoading[1], 
    3: userTriggeredLoading[2]
  };

  const imageGenerationFailed = {
    1: images.some(img => img.variation_number === 1 && img.image_data.includes('failed')),
    2: images.some(img => img.variation_number === 2 && img.image_data.includes('failed')),
    3: images.some(img => img.variation_number === 3 && img.image_data.includes('failed'))
  };

  const hasImages = images.filter(img => img.image_data !== 'generating...' && !img.image_data.includes('failed') && img.image_data.trim()).length > 0;

  // Helper function to check if image data is valid
  const isValidImageData = (imageData: string): boolean => {
    return imageData.startsWith('data:image/') || imageData.startsWith('http');
  };

  // Helper function to reset loading state for a specific variation
  const resetLoadingForVariation = useCallback((variationNumber: number) => {
    logger.imageProcessing('loading_state_reset', postId || 'unknown', variationNumber, {
      previous_loading_state: userTriggeredLoading[variationNumber - 1]
    });
    
    setUserTriggeredLoading(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = false;
      return newState;
    });
  }, [postId, userTriggeredLoading]);

  // Reset loading states when switching posts
  useEffect(() => {
    logger.imageProcessing('post_switch_reset', postId || 'unknown', 0, {
      previous_loading_states: userTriggeredLoading
    });
    setUserTriggeredLoading([false, false, false]);
  }, [postId]);

  // Fetch images when component mounts or postId changes
  const fetchImages = useCallback(async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('*')
          .eq('post_id', postId)
          .order('variation_number', { ascending: true })
          .order('updated_at', { ascending: false });

        if (error) {
          logger.error('Error fetching images:', error);
          return;
        }

        if (data) {
          // Remove duplicates by keeping the most recent record for each variation
          const uniqueImages = data.reduce((acc: LinkedInImageData[], current) => {
            const existingIndex = acc.findIndex(img => img.variation_number === current.variation_number);
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              // Keep the one with the most recent updated_at or created_at
              const existing = acc[existingIndex];
              const currentTime = new Date(current.updated_at || current.created_at).getTime();
              const existingTime = new Date(existing.updated_at || existing.created_at).getTime();
              
              if (currentTime > existingTime) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);

          setImages(uniqueImages);

          // Reset loading states for variations that now have valid images
          uniqueImages.forEach(img => {
            if (isValidImageData(img.image_data)) {
              resetLoadingForVariation(img.variation_number);
            }
          });
        }
      }, 3, 'fetch LinkedIn post images');
    } catch (error) {
      logger.error('Error fetching images:', error);
    }
  }, [postId, isAuthReady, executeWithRetry, resetLoadingForVariation]);

  // Set up real-time subscription for image updates
  useEffect(() => {
    if (!postId || !isAuthReady) return;

    const channel = supabase
      .channel(`linkedin-images-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        logger.imageProcessing('realtime_update', postId, 0, {
          event_type: payload.eventType,
          variation_number: (payload.new as any)?.variation_number || (payload.old as any)?.variation_number
        });
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new as LinkedInImageData;
          
          // Type guard to ensure we have the required properties
          if (!newImage || typeof newImage.variation_number !== 'number') {
            logger.imageProcessing('realtime_invalid_payload', postId, 0, {
              payload: payload.new
            });
            return;
          }
          
          setImages(prev => {
            // Remove any existing records for this variation to prevent duplicates
            const filtered = prev.filter(img => 
              img.variation_number !== newImage.variation_number
            );
            return [...filtered, newImage];
          });

          // Check if this is a valid completed image and reset loading state
          if (isValidImageData(newImage.image_data)) {
            logger.imageProcessing('valid_image_received', postId, newImage.variation_number, {
              image_data_type: newImage.image_data.substring(0, 50) + '...'
            });
            
            // Reset loading state immediately when valid image arrives
            resetLoadingForVariation(newImage.variation_number);

            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for variation ${newImage.variation_number} is ready.`
            });
          } else if (newImage.image_data.includes('failed')) {
            // Reset loading state for failed images too
            resetLoadingForVariation(newImage.variation_number);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old as LinkedInImageData;
          
          // Type guard for deleted image
          if (deletedImage && typeof deletedImage.variation_number === 'number') {
            setImages(prev => prev.filter(img => img.id !== deletedImage.id));
          }
        }
      })
      .subscribe();

    // Initial fetch
    fetchImages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, isAuthReady, fetchImages, toast, resetLoadingForVariation]);

  const generateImage = useCallback(async (variationNumber: number, postData?: any) => {
    if (!postId) return;

    logger.imageProcessing('generation_started', postId, variationNumber, {
      user_triggered: true
    });

    // Set user-triggered loading state immediately
    setUserTriggeredLoading(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = true;
      return newState;
    });

    try {
      await executeWithRetry(async () => {
        // Step 1: First update the database to set image_data to "generating..." for regeneration
        logger.imageProcessing('setting_generating_state', postId, variationNumber);
        
        const { data: updateResult, error: updateError } = await supabase
          .from('linkedin_post_images')
          .update({ 
            image_data: 'generating...',
            updated_at: new Date().toISOString()
          })
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .select();

        if (updateError || !updateResult || updateResult.length === 0) {
          // If no existing record to update, create new one with "generating..." state
          logger.imageProcessing('creating_new_generating_record', postId, variationNumber);
          
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
        }

        logger.imageProcessing('database_updated_to_generating', postId, variationNumber);

        // Step 2: Call webhook with proper parameters
        const webhookBody: {
          post_id: string;
          variation_number: number;
          source: string;
          post_heading?: string;
          post_content?: string;
          user_name?: string;
        } = {
          post_id: postId,
          variation_number: variationNumber,
          source: 'linkedin_history'
        };

        // Add post content if available from history data
        if (postData) {
          webhookBody.post_heading = postData[`post_heading_${variationNumber}`] || '';
          webhookBody.post_content = postData[`post_content_${variationNumber}`] || '';
          webhookBody.user_name = 'Professional User';
        }

        const webhookResponse = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/linkedin-image-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk`
          },
          body: JSON.stringify(webhookBody)
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          logger.error('Webhook call failed:', errorText);
          throw new Error('Failed to trigger image generation webhook');
        }

        const responseData = await webhookResponse.json();
        logger.imageProcessing('webhook_response', postId, variationNumber, responseData);

        // If webhook indicates it's not configured, show specific error
        if (!responseData.webhook_url_configured) {
          throw new Error('Image generation service is not configured');
        }

      }, 3, `generate image for variation ${variationNumber}`);

      // Set timeout to reset loading state after 3 minutes if no response
      const timeoutId = setTimeout(() => {
        logger.imageProcessing('generation_timeout', postId, variationNumber, {
          timeout_duration: '3_minutes'
        });
        
        setUserTriggeredLoading(prev => {
          const newState = [...prev];
          newState[variationNumber - 1] = false;
          return newState;
        });
        
        toast({
          title: "Image Generation Timeout",
          description: `Image generation took too long for variation ${variationNumber}. Please try again.`,
          variant: "destructive"
        });
      }, 180000); // 3 minutes

      toast({
        title: "Image Generation Started",
        description: `Generating image for variation ${variationNumber}. This may take a moment...`,
      });

    } catch (error) {
      logger.error('Error generating image:', error);
      
      // Reset loading state on error
      setUserTriggeredLoading(prev => {
        const newState = [...prev];
        newState[variationNumber - 1] = false;
        return newState;
      });
      
      let errorMessage = "Failed to generate image. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          errorMessage = "Image generation service is not configured. Please contact support.";
        } else if (error.message.includes('webhook failed')) {
          errorMessage = "Image generation service is temporarily unavailable. Please try again later.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [postId, toast, executeWithRetry]);

  const handleGetImageForPost = useCallback(async (item: any, postNumber: number) => {
    if (!postId) return;
    await generateImage(postNumber, item);
  }, [generateImage, postId]);

  const deleteImage = useCallback(async (imageId: string, variationNumber: number) => {
    try {
      await executeWithRetry(async () => {
        const { error } = await supabase
          .from('linkedin_post_images')
          .delete()
          .eq('id', imageId);

        if (error) {
          logger.error('Error deleting image:', error);
          throw error;
        }
      }, 3, `delete image ${imageId}`);

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId));

      toast({
        title: "Image Deleted",
        description: `Image for variation ${variationNumber} has been deleted.`,
      });

    } catch (error) {
      logger.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, executeWithRetry]);

  return {
    images,
    isGenerating: userTriggeredLoading,
    generateImage,
    fetchImages,
    deleteImage,
    // Compatibility properties for existing code
    generatedImages,
    loadingImage,
    imageGenerationFailed,
    hasImages,
    handleGetImageForPost
  };
}
