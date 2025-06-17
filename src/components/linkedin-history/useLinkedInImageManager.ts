
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
      console.log('No selectedItem, clearing all state');
      setGeneratedImages({});
      setLoadingImages({});
      setImageGenerationFailed({});
      setImageCounts({});
      return;
    }

    console.log('🔍 Loading data for post ID:', selectedItem.id);

    const loadExistingImagesAndCounts = async () => {
      try {
        // Get image counts - now with simplified query using direct user_id
        console.log('🔍 Fetching image counts for post:', selectedItem.id);
        const { data: countData, error: countError } = await supabase
          .from('linkedin_post_image_counts')
          .select('*')
          .eq('post_id', selectedItem.id);

        if (countError) {
          console.error('❌ Error loading image counts:', countError);
        } else {
          console.log('✅ Loaded image counts:', countData);
        }

        // Get images - now with simplified query using direct user_id
        console.log('🔍 Fetching images for post:', selectedItem.id);
        const { data: imageData, error: imageError } = await supabase
          .from('linkedin_post_images')
          .select('*')
          .eq('post_id', selectedItem.id)
          .order('created_at', { ascending: true });

        if (imageError) {
          console.error('❌ Error loading images:', imageError);
        } else {
          console.log('✅ Loaded images:', imageData);
        }

        // Process each variation (1, 2, 3)
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          // Get count for this specific variation
          const countRecord = countData?.find(c => c.variation_number === variation);
          const count = countRecord?.image_count || 0;
          
          console.log(`📊 Variation ${variation} count: ${count}`);
          
          setImageCounts(prev => ({
            ...prev,
            [variationKey]: count
          }));

          // Get images for this variation
          const variationImages = imageData?.filter(img => img.variation_number === variation) || [];
          
          const uniqueImages = variationImages.reduce((acc: string[], img) => {
            if (!acc.includes(img.image_data)) {
              acc.push(img.image_data);
            }
            return acc;
          }, []);
          
          setGeneratedImages(prev => ({
            ...prev,
            [variationKey]: uniqueImages
          }));

          console.log(`✅ Set ${uniqueImages.length} images for variation ${variation}`);
        }

      } catch (error) {
        console.error('❌ Error in loadExistingImagesAndCounts:', error);
      }
    };

    loadExistingImagesAndCounts();
  }, [selectedItem]);

  // Real-time subscription for image updates and count changes
  useEffect(() => {
    if (!selectedItem) return;

    console.log(`🔔 Setting up real-time subscription for post ${selectedItem.id}`);

    const channels = [];
    
    // Subscribe to image updates
    const imageChannel = supabase
      .channel(`linkedin-images-${selectedItem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linkedin_post_images',
          filter: `post_id=eq.${selectedItem.id}`
        },
        (payload) => {
          console.log('🔔 Image table change detected:', payload);
          handleImageTableChange(payload);
        }
      )
      .subscribe();
    
    channels.push(imageChannel);

    // Subscribe to count updates
    const countChannel = supabase
      .channel(`linkedin-counts-${selectedItem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linkedin_post_image_counts',
          filter: `post_id=eq.${selectedItem.id}`
        },
        (payload) => {
          console.log('🔔 Count table change detected:', payload);
          handleCountTableChange(payload);
        }
      )
      .subscribe();
    
    channels.push(countChannel);

    // Subscribe to broadcast events as backup
    for (let variation = 1; variation <= 3; variation++) {
      const broadcastChannel = supabase
        .channel(`linkedin-image-${selectedItem.id}-${variation}`)
        .on(
          'broadcast',
          {
            event: 'linkedin_image_generated'
          },
          (payload) => {
            console.log(`🔔 Received image broadcast for variation ${variation}:`, payload);
            handleImageBroadcast(payload.payload, variation);
          }
        )
        .subscribe();
      
      channels.push(broadcastChannel);
    }

    return () => {
      console.log(`🔔 Cleaning up real-time subscriptions for post ${selectedItem.id}`);
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [selectedItem]);

  const handleImageTableChange = async (payload: any) => {
    if (!selectedItem) return;
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    console.log('🔔 Processing image table change:', { eventType, newRecord, oldRecord });
    
    if (eventType === 'INSERT' && newRecord) {
      const variationKey = `${selectedItem.id}-${newRecord.variation_number}`;
      
      // Add the new image
      setGeneratedImages(prev => {
        const existingImages = prev[variationKey] || [];
        if (existingImages.includes(newRecord.image_data)) {
          return prev;
        }
        return {
          ...prev,
          [variationKey]: [...existingImages, newRecord.image_data]
        };
      });

      // Refresh the count from database
      await refreshCountFromDatabase(selectedItem.id, newRecord.variation_number);
      
      setLoadingImages(prev => ({
        ...prev,
        [variationKey]: false
      }));

      toast({
        title: "Image Generated!",
        description: `LinkedIn post image for Post ${newRecord.variation_number} is ready.`
      });
    }
  };

  const handleCountTableChange = (payload: any) => {
    if (!selectedItem) return;
    
    const { eventType, new: newRecord } = payload;
    console.log('🔔 Processing count table change:', { eventType, newRecord });
    
    if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRecord) {
      const variationKey = `${selectedItem.id}-${newRecord.variation_number}`;
      
      console.log(`🔔 Count updated for ${variationKey}: ${newRecord.image_count}`);
      
      setImageCounts(prev => {
        const newCounts = {
          ...prev,
          [variationKey]: newRecord.image_count
        };
        console.log('🔔 Updated counts via real-time:', newCounts);
        return newCounts;
      });
    }
  };

  const refreshCountFromDatabase = async (postId: string, variationNumber: number) => {
    try {
      console.log(`🔄 Refreshing count for post ${postId}, variation ${variationNumber}`);
      
      const { data, error } = await supabase
        .from('linkedin_post_image_counts')
        .select('image_count')
        .eq('post_id', postId)
        .eq('variation_number', variationNumber)
        .maybeSingle();

      if (!error && data) {
        const variationKey = `${postId}-${variationNumber}`;
        console.log(`🔄 Refreshed count for ${variationKey}: ${data.image_count}`);
        setImageCounts(prev => ({
          ...prev,
          [variationKey]: data.image_count
        }));
      } else {
        console.log(`🔄 No count record found or error:`, { error, data });
      }
    } catch (error) {
      console.error('❌ Error refreshing count:', error);
    }
  };

  const handleImageBroadcast = (payload: any, variation: number) => {
    if (!selectedItem || !payload) return;
    
    if (payload.post_id === selectedItem.id && payload.image_data) {
      const variationKey = `${selectedItem.id}-${variation}`;
      
      console.log(`🔔 Processing image broadcast for ${variationKey}`);
      
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

      // The count will be updated via the database trigger and real-time subscription
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

  const handleGetImageForPost = async (item: LinkedInPostItem, postNumber: number) => {
    const variationKey = `${item.id}-${postNumber}`;
    const currentCount = imageCounts[variationKey] || 0;

    console.log(`🚀 Attempting to generate image for ${variationKey}, current count: ${currentCount}`);

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
      console.log(`🚀 Triggering image generation for post ${postNumber} from history`);
      
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
        console.error('❌ Supabase function error:', error);
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('✅ Edge function response:', data);

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
      console.error('❌ Error triggering image generation webhook:', error);
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
