
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLinkedInImageCreditCheck } from '@/hooks/useLinkedInImageCreditCheck';

interface LinkedInImageData {
  id: string;
  image_data: string;
  variation_number: number;
  created_at: string;
}

export function useLinkedInImageManager(postId: string) {
  const [images, setImages] = useState<LinkedInImageData[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean[]>([]);
  const { toast } = useToast();
  const { checkAndDeductForImage, isDeducting } = useLinkedInImageCreditCheck();

  const generateImage = useCallback(async (variationNumber: number) => {
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
      // Insert placeholder record that will trigger the webhook
      const { error } = await supabase
        .from('linkedin_post_images')
        .insert({
          post_id: postId,
          variation_number: variationNumber,
          image_data: 'generating...' // Placeholder that will be updated by webhook
        });

      if (error) {
        console.error('Error creating image record:', error);
        toast({
          title: "Error",
          description: "Failed to start image generation. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Image Generation Started",
        description: `Generating image for variation ${variationNumber}. This may take a moment...`,
      });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  }, [postId, checkAndDeductForImage, toast]);

  const fetchImages = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }, [postId]);

  const deleteImage = useCallback(async (imageId: string, variationNumber: number) => {
    try {
      const { error } = await supabase
        .from('linkedin_post_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting image:', error);
        toast({
          title: "Error",
          description: "Failed to delete image. Please try again.",
          variant: "destructive"
        });
        return;
      }

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
  }, [toast]);

  return {
    images,
    isGenerating,
    isDeducting,
    generateImage,
    fetchImages,
    deleteImage
  };
}
