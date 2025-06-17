
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
    if (!selectedItem) {
      // Clear state when no item is selected
      setGeneratedImages({});
      setLoadingImages({});
      setImageGenerationFailed({});
      setImageCounts({});
      return;
    }

    const loadExistingImagesAndCounts = async () => {
      try {
        console.log(`Loading existing images for post ${selectedItem.id}`);
        
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          // Get the actual count and images from the database
          const { data: images, error } = await supabase
            .from('linkedin_post_images')
            .select('image_data, created_at')
            .eq('post_id', selectedItem.id)
            .eq('variation_number', variation)
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error loading images for variation ${variation}:`, error);
            continue;
          }

          const actualCount = images?.length || 0;
          console.log(`Loaded ${actualCount} images for variation ${variation}`);

          // Set the actual count from database
          setImageCounts(prev => ({
            ...prev,
            [variationKey]: actualCount
          }));

          // Set the images if any exist
          if (images && images.length > 0) {
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
          } else {
            // Ensure empty array if no images
            setGeneratedImages(prev => ({
              ...prev,
              [variationKey]: []
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

    console.log(`Setting up real-time subscription for post ${selectedItem.id}`);

    // Subscribe to both specific variation channels and history channel
    const channels = [];
    
    // Subscribe to individual variation channels
    for (let variation = 1; variation <= 3; variation++) {
      const channel = supabase
        .channel(`linkedin-image-${selectedItem.id}-${variation}`)
        .on(
          'broadcast',
          {
            event: 'linkedin_image_generated'
          },
          (payload) => {
            console.log(`Received image broadcast for variation ${variation}:`, payload);
            handleImageBroadcast(payload.payload, variation);
          }
        )
        .subscribe();
      
      channels.push(channel);
    }

    // Subscribe to history channel for this post
    const historyChannel = supabase
      .channel(`linkedin-image-history-${selectedItem.id}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received history image broadcast:', payload);
          if (payload.payload?.variation_number) {
            handleImageBroadcast(payload.payload, payload.payload.variation_number);
          }
        }
      )
      .subscribe();
    
    channels.push(historyChannel);

    return () => {
      console.log(`Cleaning up real-time subscriptions for post ${selectedItem.id}`);
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [selectedItem]);

  const handleImageBroadcast = (payload: any, variation: number) => {
    if (!selectedItem || !payload) return;
    
    if (payload.post_id === selectedItem.id && payload.image_data) {
      const variationKey = `${selectedItem.id}-${variation}`;
      
      console.log(`Processing image broadcast for ${variationKey}`);
      
      // Add with deduplication
      setGeneratedImages(prev => {
        const existingImages = prev[variationKey] || [];
        if (existingImages.includes(payload.image_data)) {
          console.log('Duplicate image detected, skipping');
          return prev;
        }
        const newImages = [...existingImages, payload.image_data];
        console.log(`Added new image, total: ${newImages.length}`);
        return {
          ...prev,
          [variationKey]: newImages
        };
      });

      // Update count
      const newCount = payload.image_count || ((imageCounts[variationKey] || 0) + 1);
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
        description: `LinkedIn post image for Post ${variation} is ready.`
      });
    }
  };

  // Enhanced polling for images during loading
  useEffect(() => {
    if (!selectedItem) return;

    const pollForImages = setInterval(async () => {
      try {
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          if (loadingImages[variationKey]) {
            console.log(`Polling for new images for ${variationKey}`);
            
            const { data: images, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data, created_at')
              .eq('post_id', selectedItem.id)
              .eq('variation_number', variation)
              .order('created_at', { ascending: true });

            if (!error && images) {
              const currentImages = generatedImages[variationKey] || [];
              
              if (images.length > currentImages.length) {
                console.log(`New images detected for ${variationKey}: ${images.length} vs ${currentImages.length}`);
                
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
                  [variationKey]: images.length
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
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => {
      clearInterval(pollForImages);
    };
  }, [selectedItem, loadingImages, generatedImages, toast]);

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
      setLoadingImages(prev => {
        if (prev[variationKey]) {
          setImageGenerationFailed(prevFailed => ({ ...prevFailed, [variationKey]: true }));
          toast({
            title: "Image Generation Failed",
            description: "Image generation timed out after 2 minutes. Please try again.",
            variant: "destructive"
          });
          return { ...prev, [variationKey]: false };
        }
        return prev;
      });
    }, 120000); // 2 minutes
    
    try {
      console.log(`Triggering image generation for post ${postNumber} from history`);
      
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
