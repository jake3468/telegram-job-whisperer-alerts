
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCreditCheck } from '@/hooks/useCreditCheck';

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
  const navigate = useNavigate();
  const { hasCredits, creditBalance, showInsufficientCreditsPopup } = useCreditCheck(0.5);
  const [generatedImages, setGeneratedImages] = useState<{ [key: number]: string[] }>({});
  const [loadingImage, setLoadingImage] = useState<{ [key: number]: boolean }>({});
  const [imageGenerationFailed, setImageGenerationFailed] = useState<{ [key: number]: boolean }>({});
  
  const timeoutIdRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});
  const isTimeoutActiveRef = useRef<{ [key: number]: boolean }>({});
  const pollIntervalRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});
  const channelRef = useRef<{ [key: number]: any }>({});

  // Helper function to add image without duplicates for specific variation
  const addImageIfNotExists = (newImageData: string, variationNumber: number) => {
    setGeneratedImages(prev => {
      const existingImages = prev[variationNumber] || [];
      // Check if this exact image data already exists for this variation
      if (existingImages.includes(newImageData)) {
        console.log(`Image already exists for variation ${variationNumber}, skipping duplicate`);
        return prev;
      }
      console.log(`Adding new unique image to variation ${variationNumber} list`);
      return {
        ...prev,
        [variationNumber]: [newImageData, ...existingImages]
      };
    });
  };

  // Load existing images when selectedItem changes
  useEffect(() => {
    if (!selectedItem?.id) {
      setGeneratedImages({});
      return;
    }

    const loadExistingImages = async () => {
      try {
        console.log(`Loading images for post ${selectedItem.id}`);
        
        const { data: images, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data, variation_number')
          .eq('post_id', selectedItem.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading existing images:', error);
          return;
        }

        if (images && images.length > 0) {
          console.log(`Found ${images.length} existing images for post ${selectedItem.id}`);
          // Group images by variation number
          const imagesByVariation: { [key: number]: string[] } = {};
          
          images.forEach(img => {
            const variation = img.variation_number || 1; // Default to variation 1 if not set
            if (!imagesByVariation[variation]) {
              imagesByVariation[variation] = [];
            }
            if (!imagesByVariation[variation].includes(img.image_data)) {
              imagesByVariation[variation].push(img.image_data);
            }
          });
          
          setGeneratedImages(imagesByVariation);
        } else {
          console.log(`No existing images found for post ${selectedItem.id}`);
          setGeneratedImages({});
        }

      } catch (error) {
        console.error('Error loading existing images:', error);
      }
    };

    loadExistingImages();
  }, [selectedItem?.id]);

  // Set up real-time subscription for all variations
  useEffect(() => {
    if (!selectedItem?.id) {
      // Clean up existing channels if no selected item
      Object.values(channelRef.current).forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      channelRef.current = {};
      return;
    }

    // Clean up existing channels before creating new ones
    Object.values(channelRef.current).forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    channelRef.current = {};

    console.log(`Setting up image subscription for post ${selectedItem.id}`);

    // Set up subscription for general history channel (for backward compatibility)
    const historyChannelName = `linkedin-image-history-${selectedItem.id}`;
    const historyChannel = supabase.channel(historyChannelName);
    
    historyChannel
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received image broadcast in history:', payload);
          
          if (payload.payload?.post_id === selectedItem.id && payload.payload?.image_data) {
            const variationNumber = payload.payload.variation_number || 1;
            console.log(`Image received for post ${selectedItem.id} variation ${variationNumber} in history`);
            
            // Clear timeouts and intervals for this variation
            if (timeoutIdRef.current[variationNumber]) {
              clearTimeout(timeoutIdRef.current[variationNumber]);
              timeoutIdRef.current[variationNumber] = null;
            }
            if (pollIntervalRef.current[variationNumber]) {
              clearTimeout(pollIntervalRef.current[variationNumber]);
              pollIntervalRef.current[variationNumber] = null;
            }
            isTimeoutActiveRef.current[variationNumber] = false;
            
            // Add new image using the helper function to avoid duplicates
            addImageIfNotExists(payload.payload.image_data, variationNumber);
            setLoadingImage(prev => ({ ...prev, [variationNumber]: false }));
            setImageGenerationFailed(prev => ({ ...prev, [variationNumber]: false }));
            
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image is ready for variation ${variationNumber}.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Image subscription status for post ${selectedItem.id}:`, status);
      });

    // Store the channel reference
    channelRef.current['history'] = historyChannel;

    return () => {
      console.log(`Cleaning up image subscription for post ${selectedItem.id}`);
      // Clear any active timeouts on cleanup
      Object.entries(timeoutIdRef.current).forEach(([variation, timeoutId]) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutIdRef.current[parseInt(variation)] = null;
        }
      });
      Object.entries(pollIntervalRef.current).forEach(([variation, intervalId]) => {
        if (intervalId) {
          clearTimeout(intervalId);
          pollIntervalRef.current[parseInt(variation)] = null;
        }
      });
      Object.keys(isTimeoutActiveRef.current).forEach(variation => {
        isTimeoutActiveRef.current[parseInt(variation)] = false;
      });
      
      // Clean up channels
      Object.values(channelRef.current).forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      channelRef.current = {};
    };
  }, [selectedItem?.id, toast]);

  const handleGetImageForPost = async (item: LinkedInPostItem, postNumber: number) => {
    // Check if user has sufficient credits
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    const heading = item[`post_heading_${postNumber}` as keyof LinkedInPostItem] as string;
    const content = item[`post_content_${postNumber}` as keyof LinkedInPostItem] as string;

    setLoadingImage(prev => ({ ...prev, [postNumber]: true }));
    setImageGenerationFailed(prev => ({ ...prev, [postNumber]: false }));
    isTimeoutActiveRef.current[postNumber] = true;
    
    // Set timeout for 2 minutes
    timeoutIdRef.current[postNumber] = setTimeout(() => {
      if (isTimeoutActiveRef.current[postNumber]) {
        console.log(`Image generation timeout for post ${item.id} variation ${postNumber}`);
        setLoadingImage(prev => ({ ...prev, [postNumber]: false }));
        setImageGenerationFailed(prev => ({ ...prev, [postNumber]: true }));
        isTimeoutActiveRef.current[postNumber] = false;
        
        // Clear polling interval on timeout
        if (pollIntervalRef.current[postNumber]) {
          clearTimeout(pollIntervalRef.current[postNumber]);
          pollIntervalRef.current[postNumber] = null;
        }
        
        toast({
          title: "Image Generation Failed",
          description: `Image generation timed out after 2 minutes for variation ${postNumber}. Please try again.`,
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes

    try {
      console.log(`Triggering image generation via edge function for post ${item.id} variation ${postNumber}`);
      
      const { data, error } = await supabase.functions.invoke('linkedin-image-webhook', {
        body: {
          post_heading: heading,
          post_content: content,
          variation_number: postNumber,
          user_name: 'Professional User',
          post_id: item.id,
          source: 'history_page'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('Edge function response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to trigger image generation');
      }

      // If the response already contains image data (immediate response)
      if (data.data && data.data.image_data) {
        console.log(`Received immediate image data from edge function for variation ${postNumber}`);
        
        // Clear timeout since we got immediate response
        if (timeoutIdRef.current[postNumber]) {
          clearTimeout(timeoutIdRef.current[postNumber]);
          timeoutIdRef.current[postNumber] = null;
          isTimeoutActiveRef.current[postNumber] = false;
        }
        
        // Add image using helper function to avoid duplicates
        addImageIfNotExists(data.data.image_data, postNumber);
        setLoadingImage(prev => ({ ...prev, [postNumber]: false }));
        
        toast({
          title: "Image Generated!",
          description: `LinkedIn post image is ready for variation ${postNumber}.`
        });
      } else {
        // Start fallback polling as backup to real-time
        console.log(`Starting fallback polling for image generation for variation ${postNumber}`);
        pollIntervalRef.current[postNumber] = setInterval(async () => {
          if (!isTimeoutActiveRef.current[postNumber]) {
            if (pollIntervalRef.current[postNumber]) {
              clearInterval(pollIntervalRef.current[postNumber]);
              pollIntervalRef.current[postNumber] = null;
            }
            return;
          }
          
          try {
            console.log(`Polling for new images for post ${item.id} variation ${postNumber}`);
            const { data: images, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', item.id)
              .eq('variation_number', postNumber)
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && images && images.length > 0) {
              const latestImage = images[0].image_data;
              const existingImages = generatedImages[postNumber] || [];
              
              // Check if this is a new image (not already in our list)
              if (!existingImages.includes(latestImage)) {
                console.log(`Found new image via polling for post ${item.id} variation ${postNumber}`);
                
                // Clear timeout and interval
                if (timeoutIdRef.current[postNumber]) {
                  clearTimeout(timeoutIdRef.current[postNumber]);
                  timeoutIdRef.current[postNumber] = null;
                  isTimeoutActiveRef.current[postNumber] = false;
                }
                if (pollIntervalRef.current[postNumber]) {
                  clearInterval(pollIntervalRef.current[postNumber]);
                  pollIntervalRef.current[postNumber] = null;
                }
                
                // Add image using helper function to avoid duplicates
                addImageIfNotExists(latestImage, postNumber);
                setLoadingImage(prev => ({ ...prev, [postNumber]: false }));
                setImageGenerationFailed(prev => ({ ...prev, [postNumber]: false }));
                
                toast({
                  title: "Image Generated!",
                  description: `LinkedIn post image is ready for variation ${postNumber}.`
                });
              }
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
        }, 3000); // Poll every 3 seconds
      }

    } catch (error) {
      console.error('Error triggering image generation:', error);
      
      // Clear timeout on error
      if (timeoutIdRef.current[postNumber]) {
        clearTimeout(timeoutIdRef.current[postNumber]);
        timeoutIdRef.current[postNumber] = null;
        isTimeoutActiveRef.current[postNumber] = false;
      }
      
      setLoadingImage(prev => ({ ...prev, [postNumber]: false }));
      setImageGenerationFailed(prev => ({ ...prev, [postNumber]: true }));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger image generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    generatedImages,
    loadingImage,
    imageGenerationFailed,
    hasImages: Object.values(generatedImages).some(images => images.length > 0),
    handleGetImageForPost
  };
};
