
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface N8NImagePayload {
  type: 'linkedin_image_ready';
  post_id: string;
  variation_number: number;
  image_data: string;
  user_name: string;
  timestamp: string;
}

export const useN8NImageDisplay = (postId: string, variationNumber: number) => {
  const [n8nImages, setN8nImages] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!postId) return;

    const channelName = `linkedin-image-display-${postId}-${variationNumber}`;
    

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'image_ready' }, (payload) => {
        const imagePayload = payload.payload as N8NImagePayload;
        
        if (imagePayload.post_id === postId && imagePayload.variation_number === variationNumber) {
          setN8nImages(prev => {
            const exists = prev.includes(imagePayload.image_data);
            if (!exists) {
              return [...prev, imagePayload.image_data];
            }
            return prev;
          });

          toast({
            title: "Image Ready from N8N!",
            description: `LinkedIn post image for variation ${variationNumber} is now available.`
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, toast]);

  return { n8nImages };
};
