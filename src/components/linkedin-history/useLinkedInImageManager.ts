
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';

interface LinkedInImageData {
  id: string;
  image_data: string;
  variation_number: number;
  created_at: string;
}

export function useLinkedInImageManager(postId: string | null) {
  const [images, setImages] = useState<LinkedInImageData[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean[]>([false, false, false]);
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();

  // Transform images data to match the expected format
  const generatedImages = {
    1: images.filter(img => img.variation_number === 1 && img.image_data !== 'generating...').map(img => img.image_data),
    2: images.filter(img => img.variation_number === 2 && img.image_data !== 'generating...').map(img => img.image_data),
    3: images.filter(img => img.variation_number === 3 && img.image_data !== 'generating...').map(img => img.image_data)
  };

  // Only show loading if actively generating AND no images exist for that variation
  const loadingImage = {
    1: isGenerating[0] && generatedImages[1].length === 0,
    2: isGenerating[1] && generatedImages[2].length === 0, 
    3: isGenerating[2] && generatedImages[3].length === 0
  };

  const imageGenerationFailed = {
    1: false,
    2: false,
    3: false
  };

  const hasImages = images.filter(img => img.image_data !== 'generating...').length > 0;

  // Reset generating states when postId changes (navigating to different history items)
  useEffect(() => {
    if (postId) {
      setIsGenerating([false, false, false]);
      setImages([]);
    }
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
          .order('variation_number', { ascending: true });

        if (error) {
          console.error('Error fetching images:', error);
          return;
        }

        if (data) {
          setImages(data);
          
          // Reset generating states based on existing images
          const newGeneratingStates = [false, false, false];
          data.forEach(img => {
            if (img.image_data === 'generating...' && img.variation_number >= 1 && img.variation_number <= 3) {
              newGeneratingStates[img.variation_number - 1] = true;
            }
          });
          setIsGenerating(newGeneratingStates);
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
            const existing = prev.find(img => img.id === newImage.id);
            if (existing) {
              return prev.map(img => img.id === newImage.id ? newImage : img);
            } else {
              return [...prev, newImage];
            }
          });

          // Handle loading state changes based on image data
          if (newImage.image_data !== 'generating...' && newImage.variation_number) {
            // Image generation completed - turn off loading for this specific variation
            setIsGenerating(prev => {
              const newState = [...prev];
              newState[newImage.variation_number - 1] = false;
              return newState;
            });

            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for variation ${newImage.variation_number} is ready.`
            });
          } else if (newImage.image_data === 'generating...' && newImage.variation_number) {
            // Image generation started - turn on loading for this specific variation
            setIsGenerating(prev => {
              const newState = [...prev];
              newState[newImage.variation_number - 1] = true;
              return newState;
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old as LinkedInImageData;
          setImages(prev => prev.filter(img => img.id !== deletedImage.id));
          
          // Reset generating state for deleted image variation
          if (deletedImage.variation_number) {
            setIsGenerating(prev => {
              const newState = [...prev];
              newState[deletedImage.variation_number - 1] = false;
              return newState;
            });
          }
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

    // Set generating state immediately when user clicks
    setIsGenerating(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = true;
      return newState;
    });

    try {
      await executeWithRetry(async () => {
        // Create placeholder record using upsert to prevent duplicates
        const { error } = await supabase
          .from('linkedin_post_images')
          .upsert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...'
          }, {
            onConflict: 'post_id,variation_number',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error creating image record:', error);
          throw error;
        }

        // Call webhook with proper parameters including post data from history
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
          webhookBody.user_name = 'Professional User'; // Default for history section
        }

        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('linkedin-image-webhook', {
          body: webhookBody
        });

        if (webhookError) {
          throw new Error(`Edge function failed: ${webhookError.message}`);
        }

        if (webhookResponse && webhookResponse.success === false) {
          if (!webhookResponse.webhook_url_configured) {
            throw new Error('Image generation service not configured');
          } else {
            throw new Error(webhookResponse.error || 'Edge function execution failed');
          }
        }

      }, 3, `generate image for variation ${variationNumber}`);

      toast({
        title: "Image Generation Started",
        description: `Generating image for variation ${variationNumber}. This may take a moment...`,
      });

    } catch (error) {
      console.error('Error generating image:', error);
      // Reset generating state on error
      setIsGenerating(prev => {
        const newState = [...prev];
        newState[variationNumber - 1] = false;
        return newState;
      });
      
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
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
      setIsGenerating(prev => {
        const newState = [...prev];
        newState[variationNumber - 1] = false;
        return newState;
      });

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
    isGenerating,
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
