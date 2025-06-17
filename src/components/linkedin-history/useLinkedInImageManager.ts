
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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isTimeoutActiveRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to add image without duplicates
  const addImageIfNotExists = (newImageData: string) => {
    setGeneratedImages(prev => {
      // Check if this exact image data already exists
      if (prev.includes(newImageData)) {
        console.log('Image already exists, skipping duplicate');
        return prev;
      }
      console.log('Adding new unique image to list');
      return [newImageData, ...prev];
    });
  };

  // Load existing images when selectedItem changes
  useEffect(() => {
    if (!selectedItem?.id) {
      setGeneratedImages([]);
      return;
    }

    const loadExistingImages = async () => {
      try {
        console.log(`Loading images for post ${selectedItem.id}`);
        
        const { data: images, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', selectedItem.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading existing images:', error);
          return;
        }

        if (images && images.length > 0) {
          console.log(`Found ${images.length} existing images for post ${selectedItem.id}`);
          // Remove duplicates using Set to ensure unique images
          const uniqueImages = Array.from(new Set(images.map(img => img.image_data)));
          setGeneratedImages(uniqueImages);
        } else {
          console.log(`No existing images found for post ${selectedItem.id}`);
          setGeneratedImages([]);
        }

      } catch (error) {
        console.error('Error loading existing images:', error);
      }
    };

    loadExistingImages();
  }, [selectedItem?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!selectedItem?.id) return;

    console.log(`Setting up image subscription for post ${selectedItem.id}`);

    const channel = supabase
      .channel(`linkedin-image-history-${selectedItem.id}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received image broadcast in history:', payload);
          
          if (payload.payload?.post_id === selectedItem.id && payload.payload?.image_data) {
            console.log(`Image received for post ${selectedItem.id} in history`);
            
            // Clear all timeouts and intervals when image is received
            if (timeoutIdRef.current) {
              clearTimeout(timeoutIdRef.current);
              timeoutIdRef.current = null;
            }
            if (pollIntervalRef.current) {
              clearTimeout(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            isTimeoutActiveRef.current = false;
            
            // Add new image using the helper function to avoid duplicates
            addImageIfNotExists(payload.payload.image_data);
            setLoadingImage(false);
            setImageGenerationFailed(false);
            
            toast({
              title: "Image Generated!",
              description: "LinkedIn post image is ready."
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Image subscription status for post ${selectedItem.id}:`, status);
      });

    return () => {
      console.log(`Cleaning up image subscription for post ${selectedItem.id}`);
      // Clear any active timeouts on cleanup
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isTimeoutActiveRef.current = false;
      supabase.removeChannel(channel);
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

    setLoadingImage(true);
    setImageGenerationFailed(false);
    isTimeoutActiveRef.current = true;
    
    // Set timeout for 2 minutes
    timeoutIdRef.current = setTimeout(() => {
      if (isTimeoutActiveRef.current) {
        console.log(`Image generation timeout for post ${item.id}`);
        setLoadingImage(false);
        setImageGenerationFailed(true);
        isTimeoutActiveRef.current = false;
        
        // Clear polling interval on timeout
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        toast({
          title: "Image Generation Failed",
          description: "Image generation timed out after 2 minutes. Please try again.",
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes

    try {
      console.log("Triggering image generation via edge function for post", item.id);
      
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
        console.log('Received immediate image data from edge function');
        
        // Clear timeout since we got immediate response
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
          isTimeoutActiveRef.current = false;
        }
        
        // Add image using helper function to avoid duplicates
        addImageIfNotExists(data.data.image_data);
        setLoadingImage(false);
        
        toast({
          title: "Image Generated!",
          description: "LinkedIn post image is ready."
        });
      } else {
        // Start fallback polling as backup to real-time
        console.log('Starting fallback polling for image generation');
        pollIntervalRef.current = setInterval(async () => {
          if (!isTimeoutActiveRef.current) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }
          
          try {
            console.log(`Polling for new images for post ${item.id}`);
            const { data: images, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', item.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (!error && images && images.length > 0) {
              const latestImage = images[0].image_data;
              
              // Check if this is a new image (not already in our list)
              if (!generatedImages.includes(latestImage)) {
                console.log('Found new image via polling for post', item.id);
                
                // Clear timeout and interval
                if (timeoutIdRef.current) {
                  clearTimeout(timeoutIdRef.current);
                  timeoutIdRef.current = null;
                  isTimeoutActiveRef.current = false;
                }
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
                
                // Add image using helper function to avoid duplicates
                addImageIfNotExists(latestImage);
                setLoadingImage(false);
                setImageGenerationFailed(false);
                
                toast({
                  title: "Image Generated!",
                  description: "LinkedIn post image is ready."
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
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
        isTimeoutActiveRef.current = false;
      }
      
      setLoadingImage(false);
      setImageGenerationFailed(true);
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
    hasImages: generatedImages.length > 0,
    handleGetImageForPost
  };
};
