
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLinkedInImageCreditCheck } from '@/hooks/useLinkedInImageCreditCheck';
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
  const { checkAndDeductForImage, isDeducting } = useLinkedInImageCreditCheck();

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
          // Update generating states based on fetched data
          setIsGenerating(prev => {
            const newState = [false, false, false];
            data.forEach(img => {
              if (img.variation_number && img.image_data === 'generating...') {
                newState[img.variation_number - 1] = true;
              }
            });
            return newState;
          });
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
      }, (payload) => {
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

          // Update generating state
          if (newImage.image_data !== 'generating...') {
            setIsGenerating(prev => {
              const newState = [...prev];
              if (newImage.variation_number) {
                newState[newImage.variation_number - 1] = false;
              }
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

  const generateImage = useCallback(async (variationNumber: number) => {
    if (!postId) return;

    // Check and deduct credits before generating image
    const canProceed = await checkAndDeductForImage(postId, variationNumber);
    if (!canProceed) {
      return;
    }

    setIsGenerating(prev => {
      const newState = [...prev];
      newState[variationNumber - 1] = true;
      return newState;
    });

    try {
      await executeWithRetry(async () => {
        const { error } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...' // Placeholder that will be updated by webhook
          });

        if (error) {
          console.error('Error creating image record:', error);
          throw error;
        }
      }, 3, `generate image for variation ${variationNumber}`);

      toast({
        title: "Image Generation Started",
        description: `Generating image for variation ${variationNumber}. This may take a moment...`,
      });

    } catch (error) {
      console.error('Error generating image:', error);
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
  }, [postId, checkAndDeductForImage, toast, executeWithRetry]);

  const handleGetImageForPost = useCallback(async (item: any, postNumber: number) => {
    if (!postId) return;
    await generateImage(postNumber);
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
    isDeducting,
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
