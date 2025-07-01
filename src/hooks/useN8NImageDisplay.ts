
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useN8NImageDisplay = (postId: string, variationNumber: number): UseN8NImageDisplayReturn => {
  const [n8nImages, setN8nImages] = useState<string[]>([]);
  const { toast } = useToast();

  const resetLoadingState = () => {
    // This will be called from the component to reset button state
    console.log(`🔄 Resetting loading state for variation ${variationNumber}`);
  };

  useEffect(() => {
    if (!postId) return;

    const channelName = `linkedin-image-display-${postId}-${variationNumber}`;
    console.log(`🎯 Setting up N8N image listener for channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'image_ready' }, (payload) => {
        console.log('🎯 N8N Image received via broadcast:', payload);
        
        const imagePayload = payload.payload as N8NImagePayload;
        
        if (imagePayload.post_id === postId && imagePayload.variation_number === variationNumber) {
          console.log(`🎯 Adding N8N image for variation ${variationNumber}`);
          
          setN8nImages(prev => {
            const exists = prev.includes(imagePayload.image_data);
            if (exists) {
              console.log('🎯 N8N Image already exists in state');
              return prev;
            }
            console.log('🎯 Adding new N8N image to state');
            return [...prev, imagePayload.image_data];
          });

          toast({
            title: "Image Ready!",
            description: `LinkedIn post image for variation ${variationNumber} is now available.`
          });
        }
      })
      .subscribe((status) => {
        console.log(`🎯 N8N Image channel subscription status for variation ${variationNumber}:`, status);
      });

    return () => {
      console.log(`🧹 Cleaning up N8N image listener for variation ${variationNumber}`);
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, toast]);

  return { n8nImages, resetLoadingState };
};
