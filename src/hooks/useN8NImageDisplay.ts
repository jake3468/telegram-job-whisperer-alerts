
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';

interface N8NImagePayload {
  type: 'linkedin_image_ready';
  post_id: string;
  variation_number: number;
  image_data: string;
  timestamp: string;
}

interface UseN8NImageDisplayReturn {
  n8nImages: string[];
  resetLoadingState: () => void;
}

export const useN8NImageDisplay = (postId: string, variationNumber: number, onImageReceived?: () => void): UseN8NImageDisplayReturn => {
  const [n8nImages, setN8nImages] = useState<string[]>([]);
  const [isPollingDisabled, setIsPollingDisabled] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();
  const cleanupRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();

  const resetLoadingState = () => {
    if (onImageReceived) {
      onImageReceived();
    }
  };

  // Single poll attempt with strict failure handling
  const pollForImages = async () => {
    if (!postId || !isAuthReady || isPollingDisabled || consecutiveFailures >= 3) {
      return;
    }

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber);

        if (error) {
          setConsecutiveFailures(prev => prev + 1);
          return;
        }

        if (data && data.length > 0) {
          const imageUrls = data.map(img => img.image_data);
          
          setN8nImages(prev => {
            const newImages = imageUrls.filter(url => !prev.includes(url));
            if (newImages.length > 0) {
              if (onImageReceived) {
                onImageReceived();
              }
              setConsecutiveFailures(0);
              setIsPollingDisabled(true); // Stop polling once we get images
              return [...prev, ...newImages];
            }
            return prev;
          });
        }
      }, 1, `poll for images variation ${variationNumber}`);
    } catch (err) {
      setConsecutiveFailures(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setIsPollingDisabled(true); // Disable polling after 3 failures
        }
        return newCount;
      });
    }
  };

  useEffect(() => {
    if (!postId || !isAuthReady) return;

    const channelName = `linkedin-image-display-${postId}-${variationNumber}`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'image_ready' }, (payload) => {
        const imagePayload = payload.payload as N8NImagePayload;
        
        if (imagePayload.post_id === postId && imagePayload.variation_number === variationNumber) {
          setN8nImages(prev => {
            const exists = prev.includes(imagePayload.image_data);
            if (exists) {
              return prev;
            }
            return [...prev, imagePayload.image_data];
          });

          if (onImageReceived) {
            onImageReceived();
          }

          setConsecutiveFailures(0);
          setIsPollingDisabled(true); // Stop polling once we get real-time data

          toast({
            title: "Image Ready!",
            description: `LinkedIn post image for variation ${variationNumber} is now available.`
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Single poll attempt after subscription, then stop
          pollingTimeoutRef.current = setTimeout(() => {
            pollForImages();
          }, 3000);
        }
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Only do ONE more poll attempt on channel failure, then give up
          if (!isPollingDisabled && consecutiveFailures < 2) {
            pollingTimeoutRef.current = setTimeout(() => {
              pollForImages();
            }, 5000);
          }
        }
      });

    cleanupRef.current = () => {
      supabase.removeChannel(channel);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };

    return cleanupRef.current;
  }, [postId, variationNumber, toast, onImageReceived, isAuthReady, executeWithRetry, isPollingDisabled, consecutiveFailures]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setConsecutiveFailures(0);
      setIsPollingDisabled(false);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  return { n8nImages, resetLoadingState };
};
