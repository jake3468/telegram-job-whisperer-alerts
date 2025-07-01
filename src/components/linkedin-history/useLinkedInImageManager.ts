
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

  const loadingImage = {
    1: isGenerating[0] || images.some(img => img.variation_number === 1 && img.image_data === 'generating...'),
    2: isGenerating[1] || images.some(img => img.variation_number === 2 && img.image_data === 'generating...'), 
    3: isGenerating[2] || images.some(img => img.variation_number === 3 && img.image_data === 'generating...')
  };

  const imageGenerationFailed = {
    1: false,
    2: false,
    3: false
  };

  const hasImages = images.filter(img => img.image_data !== 'generating...').length > 0;

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
          // Reset generating states properly based on current image data
          setIsGenerating([false, false, false]);
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
            // Image generation completed - turn off loading
            setIsGenerating(prev => {
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

    // Set generating state immediately when user clicks
    setIsGenerating(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = true;
      return newState;
    });

    try {
      await executeWithRetry(async () => {
        // Create placeholder record
        const { error } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...'
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
