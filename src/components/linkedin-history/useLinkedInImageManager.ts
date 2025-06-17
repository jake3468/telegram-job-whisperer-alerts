
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInPostItem {
  id: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
}

export const useLinkedInImageManager = (selectedItem: LinkedInPostItem | null) => {
  const { toast } = useToast();
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string[]}>({});
  const [loadingImages, setLoadingImages] = useState<{[key: string]: boolean}>({});
  const [imageGenerationFailed, setImageGenerationFailed] = useState<{[key: string]: boolean}>({});
  const [imageCounts, setImageCounts] = useState<{[key: string]: number}>({});

  // Load existing images and counts when item is selected
  useEffect(() => {
    if (!selectedItem) return;

    const loadExistingImagesAndCounts = async () => {
      try {
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          // Get the actual count of images from the database
          const { count, error: countError } = await supabase
            .from('linkedin_post_images')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', selectedItem.id)
            .eq('variation_number', variation);

          if (countError) {
            console.error(`Error getting count for variation ${variation}:`, countError);
            continue;
          }

          const actualCount = count || 0;
          console.log(`Variation ${variation} has ${actualCount} images in database`);

          // Set the actual count from database
          setImageCounts(prev => ({
            ...prev,
            [variationKey]: actualCount
          }));

          // Now load the actual images
          const { data: images, error } = await supabase
            .from('linkedin_post_images')
            .select('image_data')
            .eq('post_id', selectedItem.id)
            .eq('variation_number', variation)
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error loading existing images for variation ${variation}:`, error);
            continue;
          }

          if (images && images.length > 0) {
            // Remove duplicates
            const uniqueImages = images.reduce((acc: string[], img) => {
              if (!acc.includes(img.image_data)) {
                acc.push(img.image_data);
              }
              return acc;
            }, []);
            
            setGeneratedImages(prev => ({
              ...prev,
              [variationKey]: uniqueImages
            }));
          }
        }
      } catch (error) {
        console.error('Error loading existing images and counts:', error);
      }
    };

    loadExistingImagesAndCounts();
  }, [selectedItem]);

  // Real-time subscription for image updates
  useEffect(() => {
    if (!selectedItem) return;

    console.log(`Setting up history image subscription for post ${selectedItem.id}`);

    const channel = supabase
      .channel(`linkedin-image-history-${selectedItem.id}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received history image broadcast:', payload);
          
          if (payload.payload?.post_id === selectedItem.id && payload.payload?.image_data) {
            const variationKey = `${selectedItem.id}-${payload.payload.variation_number}`;
            
            // Add with deduplication
            setGeneratedImages(prev => {
              const existingImages = prev[variationKey] || [];
              if (existingImages.includes(payload.payload.image_data)) {
                console.log('Duplicate image in history, skipping');
                return prev;
              }
              return {
                ...prev,
                [variationKey]: [...existingImages, payload.payload.image_data]
              };
            });

            // Update count based on actual database count or increment
            const newCount = payload.payload.image_count || ((imageCounts[variationKey] || 0) + 1);
            setImageCounts(prev => ({
              ...prev,
              [variationKey]: newCount
            }));
            
            setLoadingImages(prev => ({
              ...prev,
              [variationKey]: false
            }));

            setImageGenerationFailed(prev => ({
              ...prev,
              [variationKey]: false
            }));
            
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for Post ${payload.payload.variation_number} is ready.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`History image subscription status:`, status);
      });

    return () => {
      console.log(`Cleaning up history image subscription`);
      supabase.removeChannel(channel);
    };
  }, [selectedItem, toast, imageCounts]);

  // Enhanced polling for images
  useEffect(() => {
    if (!selectedItem) return;

    const pollForImages = setInterval(async () => {
      try {
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          if (loadingImages[variationKey]) {
            // Check the actual count in database
            const { count, error: countError } = await supabase
              .from('linkedin_post_images')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', selectedItem.id)
              .eq('variation_number', variation);

            if (!countError && count !== null) {
              const currentCount = imageCounts[variationKey] || 0;
              
              if (count > currentCount) {
                console.log(`New images detected for ${variationKey}: ${count} vs ${currentCount}`);
                
                // Load the latest images
                const { data: images, error } = await supabase
                  .from('linkedin_post_images')
                  .select('image_data')
                  .eq('post_id', selectedItem.id)
                  .eq('variation_number', variation)
                  .order('created_at', { ascending: true });

                if (!error && images) {
                  const uniqueImages = images.reduce((acc: string[], img) => {
                    if (!acc.includes(img.image_data)) {
                      acc.push(img.image_data);
                    }
                    return acc;
                  }, []);

                  setGeneratedImages(prev => ({
                    ...prev,
                    [variationKey]: uniqueImages
                  }));
                  
                  setImageCounts(prev => ({
                    ...prev,
                    [variationKey]: count
                  }));
                  
                  setLoadingImages(prev => ({
                    ...prev,
                    [variationKey]: false
                  }));
                  
                  toast({
                    title: "Image Generated!",
                    description: `LinkedIn post image for Post ${variation} is ready.`
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('History polling error:', error);
      }
    }, 3000);

    return () => {
      clearInterval(pollForImages);
    };
  }, [selectedItem, loadingImages, imageCounts, toast]);

  const handleGetImageForPost = async (item: LinkedInPostItem, postNumber: number) => {
    const variationKey = `${item.id}-${postNumber}`;
    const currentCount = imageCounts[variationKey] || 0;

    if (currentCount >= 3) {
      toast({
        title: "Limit Reached",
        description: "Maximum 3 images allowed per post variation.",
        variant: "destructive"
      });
      return;
    }

    const heading = item[`post_heading_${postNumber}` as keyof LinkedInPostItem] as string;
    const content = item[`post_content_${postNumber}` as keyof LinkedInPostItem] as string;
    
    setLoadingImages(prev => ({ ...prev, [variationKey]: true }));
    setImageGenerationFailed(prev => ({ ...prev, [variationKey]: false }));

    // Set timeout for 2 minutes
    const timeoutId = setTimeout(() => {
      if (loadingImages[variationKey]) {
        setLoadingImages(prev => ({ ...prev, [variationKey]: false }));
        setImageGenerationFailed(prev => ({ ...prev, [variationKey]: true }));
        toast({
          title: "Image Generation Failed",
          description: "Image generation timed out after 2 minutes. Please try again.",
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes
    
    try {
      console.log(`Triggering image generation via edge function for post ${postNumber} from history`);
      
      const { data, error } = await supabase.functions.invoke('linkedin-image-webhook', {
        body: {
          post_heading: heading,
          post_content: content,
          variation_number: postNumber,
          user_name: 'Professional User',
          post_id: item.id,
          source: 'history'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('Edge function response:', data);

      if (!data.success) {
        clearTimeout(timeoutId);
        if (data.limit_exceeded) {
          setImageCounts(prev => ({ ...prev, [variationKey]: 3 }));
          toast({
            title: "Generation Limit Exceeded",
            description: "Maximum 3 images allowed per post variation.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error || 'Failed to trigger image generation');
        }
        setLoadingImages(prev => ({ ...prev, [variationKey]: false }));
        return;
      }

      toast({
        title: "Image Generation Started",
        description: `LinkedIn post image for Post ${postNumber} is being generated...`
      });
    } catch (error) {
      console.error('Error triggering image generation webhook:', error);
      clearTimeout(timeoutId);
      setLoadingImages(prev => ({ ...prev, [variationKey]: false }));
      setImageGenerationFailed(prev => ({ ...prev, [variationKey]: true }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger image generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    generatedImages,
    loadingImages,
    imageGenerationFailed,
    imageCounts,
    handleGetImageForPost
  };
};
