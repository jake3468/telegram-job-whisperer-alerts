
import { useEffect, useState } from 'react';
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
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [lastPollTime, setLastPollTime] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();

  const resetLoadingState = () => {
    if (onImageReceived) {
      onImageReceived();
    }
  };

  // Controlled polling with exponential backoff and circuit breaker
  const pollForImages = async () => {
    if (!postId || !isAuthReady) return;

    // Circuit breaker - stop polling after 5 consecutive failures
    if (consecutiveFailures >= 5) {
      return;
    }

    // Max 8 polling attempts with longer intervals
    if (pollingAttempts >= 8) {
      return;
    }

    // Exponential backoff: 5s, 7s, 10s, 15s, 22s, 30s...
    const now = Date.now();
    const baseInterval = 5000;
    const backoffMultiplier = Math.pow(1.5, pollingAttempts);
    const interval = Math.min(baseInterval * backoffMultiplier, 30000);
    
    if (now - lastPollTime < interval) {
      return;
    }

    setLastPollTime(now);
    setPollingAttempts(prev => prev + 1);

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
              // Reset on success
              setPollingAttempts(0);
              setConsecutiveFailures(0);
              return [...prev, ...newImages];
            }
            return prev;
          });
        }
      }, 1, `poll for images variation ${variationNumber}`);
    } catch (err) {
      setConsecutiveFailures(prev => prev + 1);
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

          setPollingAttempts(0);
          setConsecutiveFailures(0);

          toast({
            title: "Image Ready!",
            description: `LinkedIn post image for variation ${variationNumber} is now available.`
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Single initial poll after successful subscription
          setTimeout(() => pollForImages(), 2000);
        }
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Start limited polling as fallback
          const pollInterval = setInterval(() => {
            pollForImages();
          }, 10000);
          
          // Stop polling after 3 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
          }, 180000);
          
          return () => clearInterval(pollInterval);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setPollingAttempts(0);
      setConsecutiveFailures(0);
    };
  }, [postId, variationNumber, toast, onImageReceived, isAuthReady, executeWithRetry]);

  return { n8nImages, resetLoadingState };
};
