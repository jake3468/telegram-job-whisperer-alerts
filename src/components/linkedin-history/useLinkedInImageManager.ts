import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';

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

  // Reset loading states when switching posts
  useEffect(() => {
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
          console.error('Error fetching images:', error);
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
        }
      }, 3, 'fetch LinkedIn post images');
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }, [postId, isAuthReady, executeWithRetry]);

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
        console.log('LinkedIn image updated via real-time:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new as LinkedInImageData;
          
          setImages(prev => {
            // Remove any existing records for this variation to prevent duplicates
            const filtered = prev.filter(img => 
              img.variation_number !== newImage.variation_number
            );
            return [...filtered, newImage];
          });

          // Only show success toast for actual completed images, not generating/failed states
          if (newImage.image_data !== 'generating...' && 
              !newImage.image_data.includes('failed') && 
              newImage.image_data.trim() && 
              newImage.variation_number) {
            
            // Reset loading state for this variation when image arrives
            setUserTriggeredLoading(prev => {
              const newState = [...prev];
              newState[newImage.variation_number - 1] = false;
              return newState;
            });

            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for variation ${newImage.variation_number} is ready.`
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old as LinkedInImageData;
          setImages(prev => prev.filter(img => img.id !== deletedImage.id));
        }
      })
      .subscribe();

    // Initial fetch
    fetchImages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, isAuthReady, fetchImages, toast]);

  const generateImage = useCallback(async (variationNumber: number, postData?: any) => {
    if (!postId) return;

    // Set user-triggered loading state immediately
    setUserTriggeredLoading(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = true;
      return newState;
    });

    // Set timeout to reset loading state after 3 minutes if no response
    const timeoutId = setTimeout(() => {
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

    try {
      await executeWithRetry(async () => {
        // Call webhook with proper parameters
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
          console.error('Webhook call failed:', errorText);
          throw new Error('Failed to trigger image generation webhook');
        }

        const responseData = await webhookResponse.json();
        console.log('Webhook response:', responseData);

        // Clear the timeout since webhook call succeeded
        clearTimeout(timeoutId);

        // If webhook indicates it's not configured, show specific error
        if (!responseData.webhook_url_configured) {
          throw new Error('Image generation service is not configured');
        }

      }, 3, `generate image for variation ${variationNumber}`);

      toast({
        title: "Image Generation Started",
        description: `Generating image for variation ${variationNumber}. This may take a moment...`,
      });

    } catch (error) {
      console.error('Error generating image:', error);
      clearTimeout(timeoutId);
      
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
          console.error('Error deleting image:', error);
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
      console.error('Error deleting image:', error);
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
