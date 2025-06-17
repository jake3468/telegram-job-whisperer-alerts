
import { useState, useEffect, useRef } from 'react';
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isTimeoutActiveRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing image when selectedItem changes
  useEffect(() => {
    if (!selectedItem?.id) {
      setGeneratedImage(null);
      setHasImage(false);
      return;
    }

    const loadExistingImage = async () => {
      try {
        console.log(`Loading image for post ${selectedItem.id}`);
        
        const { data: image, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', selectedItem.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading existing image:', error);
          return;
        }

        if (image) {
          console.log(`Found existing image for post ${selectedItem.id}`);
          setGeneratedImage(image.image_data);
          setHasImage(true);
        } else {
          console.log(`No existing image found for post ${selectedItem.id}`);
          setGeneratedImage(null);
          setHasImage(false);
        }

      } catch (error) {
        console.error('Error loading existing image:', error);
      }
    };

    loadExistingImage();
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
            
            setGeneratedImage(payload.payload.image_data);
            setHasImage(true);
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
    if (hasImage) {
      toast({
        title: "Image Already Generated",
        description: "This LinkedIn post already has an image.",
        variant: "destructive"
      });
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
        if (data.limit_exceeded) {
          setHasImage(true); // Mark as having image to disable button
          toast({
            title: "Generation Limit Exceeded",
            description: "This post already has an image generated.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error || 'Failed to trigger image generation');
        }
        
        // Clear timeout and reset state
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
          isTimeoutActiveRef.current = false;
        }
        setLoadingImage(false);
        return;
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
        
        setGeneratedImage(data.data.image_data);
        setHasImage(true);
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
            console.log(`Polling for new image for post ${item.id}`);
            const { data: image, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', item.id)
              .maybeSingle();

            if (!error && image) {
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
              
              setGeneratedImage(image.image_data);
              setHasImage(true);
              setLoadingImage(false);
              setImageGenerationFailed(false);
              
              toast({
                title: "Image Generated!",
                description: "LinkedIn post image is ready."
              });
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
    generatedImage,
    loadingImage,
    imageGenerationFailed,
    hasImage,
    handleGetImageForPost
  };
};
