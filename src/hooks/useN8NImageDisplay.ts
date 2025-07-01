
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
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();

  const resetLoadingState = () => {
    console.log(`🔄 Resetting loading state for variation ${variationNumber}`);
    if (onImageReceived) {
      onImageReceived();
    }
  };

  // Enhanced polling mechanism with proper authentication
  const pollForImages = async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber);

        if (error) {
          console.error('Error polling for images:', error);
          return;
        }

        if (data && data.length > 0) {
          const imageUrls = data.map(img => img.image_data);
          console.log(`📡 Found ${imageUrls.length} images via polling for variation ${variationNumber}`);
          
          setN8nImages(prev => {
            const newImages = imageUrls.filter(url => !prev.includes(url));
            if (newImages.length > 0) {
              console.log(`📡 Adding ${newImages.length} new images via polling`);
              if (onImageReceived) {
                onImageReceived();
              }
              return [...prev, ...newImages];
            }
            return prev;
          });
        }
      }, 3, `poll for images variation ${variationNumber}`);
    } catch (err) {
      console.error('Error in polling for images:', err);
    }
  };

  useEffect(() => {
    if (!postId || !isAuthReady) return;

    const channelName = `linkedin-image-display-${postId}-${variationNumber}`;
    console.log(`🎯 Setting up image listener for channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'image_ready' }, (payload) => {
        console.log('🎯 Image received via broadcast:', payload);
        
        const imagePayload = payload.payload as N8NImagePayload;
        
        if (imagePayload.post_id === postId && imagePayload.variation_number === variationNumber) {
          console.log(`🎯 Adding image for variation ${variationNumber}`);
          
          setN8nImages(prev => {
            const exists = prev.includes(imagePayload.image_data);
            if (exists) {
              console.log('🎯 Image already exists in state');
              return prev;
            }
            console.log('🎯 Adding new image to state');
            return [...prev, imagePayload.image_data];
          });

          // Reset loading state when image is received
          if (onImageReceived) {
            onImageReceived();
          }

          toast({
            title: "Image Ready!",
            description: `LinkedIn post image for variation ${variationNumber} is now available.`
          });
        }
      })
      .subscribe((status) => {
        console.log(`🎯 Image channel subscription status for variation ${variationNumber}:`, status);
        
        // If subscription succeeds, do initial poll
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active, doing initial poll');
          pollForImages();
        }
        
        // If subscription fails, start polling as fallback
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('🔄 Real-time failed, starting polling fallback');
          
          // Start aggressive polling as fallback
          const pollInterval = setInterval(() => {
            pollForImages();
          }, 2000); // Poll every 2 seconds
          
          // Clean up polling when component unmounts
          return () => clearInterval(pollInterval);
        }
      });

    // Clean up function
    return () => {
      console.log(`🧹 Cleaning up image listener for variation ${variationNumber}`);
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, toast, onImageReceived, isAuthReady, executeWithRetry]);

  return { n8nImages, resetLoadingState };
};
