
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@clerk/clerk-react';

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
  const { getToken, userId: clerkUserId } = useAuth();
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string[]}>({});
  const [loadingImages, setLoadingImages] = useState<{[key: string]: boolean}>({});
  const [imageGenerationFailed, setImageGenerationFailed] = useState<{[key: string]: boolean}>({});
  const [imageCounts, setImageCounts] = useState<{[key: string]: number}>({});

  // Debug function to check authentication and RLS setup
  const debugAuthAndRLS = async () => {
    console.log('🔍 DEBUG: Starting authentication and RLS debugging');
    console.log('🔍 DEBUG: Clerk User ID:', clerkUserId);
    
    try {
      // Check if JWT token is properly set
      const token = await getToken({ template: 'supabase' });
      console.log('🔍 DEBUG: Supabase JWT token exists:', !!token);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 DEBUG: JWT payload sub (should match Clerk ID):', payload.sub);
          console.log('🔍 DEBUG: JWT payload structure:', {
            sub: !!payload.sub,
            iss: !!payload.iss,
            aud: !!payload.aud,
            exp: !!payload.exp,
            iat: !!payload.iat
          });
        } catch (e) {
          console.error('🔍 DEBUG: Failed to parse JWT payload:', e);
        }
      }

      // Test get_clerk_user_id function directly
      console.log('🔍 DEBUG: Testing get_clerk_user_id() function...');
      const { data: clerkIdTest, error: clerkIdError } = await supabase
        .rpc('get_clerk_user_id');
      
      if (clerkIdError) {
        console.error('🔍 DEBUG: get_clerk_user_id() error:', clerkIdError);
      } else {
        console.log('🔍 DEBUG: get_clerk_user_id() returned:', clerkIdTest);
        console.log('🔍 DEBUG: Does it match Clerk user ID?', clerkIdTest === clerkUserId);
      }

      // Check user record in users table
      console.log('🔍 DEBUG: Checking user record in users table...');
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .maybeSingle();
      
      if (userError) {
        console.error('🔍 DEBUG: Error fetching user record:', userError);
      } else {
        console.log('🔍 DEBUG: User record:', userRecord);
      }

      // Check user_profile record
      if (userRecord) {
        console.log('🔍 DEBUG: Checking user_profile record...');
        const { data: profileRecord, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userRecord.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('🔍 DEBUG: Error fetching user_profile record:', profileError);
        } else {
          console.log('🔍 DEBUG: User profile record:', profileRecord);
        }
      }

    } catch (error) {
      console.error('🔍 DEBUG: Error in auth debugging:', error);
    }
  };

  // Debug function to check table permissions and data
  const debugTableAccess = async (postId: string) => {
    console.log('🔍 DEBUG: Testing table access for post ID:', postId);
    
    try {
      // Test direct access to linkedin_post_image_counts
      console.log('🔍 DEBUG: Testing linkedin_post_image_counts access...');
      const { data: countData, error: countError } = await supabase
        .from('linkedin_post_image_counts')
        .select('*', { count: 'exact' });
      
      console.log('🔍 DEBUG: linkedin_post_image_counts query result:', {
        data: countData,
        error: countError,
        totalCount: countData?.length || 0
      });

      // Test access with post_id filter
      console.log('🔍 DEBUG: Testing linkedin_post_image_counts with post_id filter...');
      const { data: countFilteredData, error: countFilteredError } = await supabase
        .from('linkedin_post_image_counts')
        .select('*')
        .eq('post_id', postId);
      
      console.log('🔍 DEBUG: linkedin_post_image_counts filtered query result:', {
        data: countFilteredData,
        error: countFilteredError,
        count: countFilteredData?.length || 0
      });

      // Test direct access to linkedin_post_images
      console.log('🔍 DEBUG: Testing linkedin_post_images access...');
      const { data: imageData, error: imageError } = await supabase
        .from('linkedin_post_images')
        .select('*', { count: 'exact' });
      
      console.log('🔍 DEBUG: linkedin_post_images query result:', {
        data: imageData,
        error: imageError,
        totalCount: imageData?.length || 0
      });

      // Test access with post_id filter
      console.log('🔍 DEBUG: Testing linkedin_post_images with post_id filter...');
      const { data: imageFilteredData, error: imageFilteredError } = await supabase
        .from('linkedin_post_images')
        .select('*')
        .eq('post_id', postId);
      
      console.log('🔍 DEBUG: linkedin_post_images filtered query result:', {
        data: imageFilteredData,
        error: imageFilteredError,
        count: imageFilteredData?.length || 0
      });

      // Test job_linkedin access
      console.log('🔍 DEBUG: Testing job_linkedin access for post:', postId);
      const { data: jobLinkedinData, error: jobLinkedinError } = await supabase
        .from('job_linkedin')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      
      console.log('🔍 DEBUG: job_linkedin query result:', {
        data: jobLinkedinData,
        error: jobLinkedinError
      });

    } catch (error) {
      console.error('🔍 DEBUG: Error in table access debugging:', error);
    }
  };

  // Load existing images and counts when item is selected
  useEffect(() => {
    if (!selectedItem) {
      console.log('🔍 DEBUG: No selectedItem, clearing all state');
      setGeneratedImages({});
      setLoadingImages({});
      setImageGenerationFailed({});
      setImageCounts({});
      return;
    }

    console.log('🔍 DEBUG: Loading data for post ID:', selectedItem.id);

    const loadExistingImagesAndCounts = async () => {
      try {
        // Run debugging functions
        await debugAuthAndRLS();
        await debugTableAccess(selectedItem.id);

        // Get image counts with detailed logging
        console.log('🔍 DEBUG: Fetching image counts for post:', selectedItem.id);
        const { data: countData, error: countError } = await supabase
          .from('linkedin_post_image_counts')
          .select('*')
          .eq('post_id', selectedItem.id);

        if (countError) {
          console.error('❌ DEBUG: Error loading image counts:', countError);
          console.error('❌ DEBUG: Count error details:', {
            message: countError.message,
            code: countError.code,
            details: countError.details,
            hint: countError.hint
          });
        } else {
          console.log('✅ DEBUG: Loaded image counts successfully:', countData);
          console.log('✅ DEBUG: Count data details:', {
            totalRecords: countData?.length || 0,
            records: countData?.map(record => ({
              id: record.id,
              post_id: record.post_id,
              variation_number: record.variation_number,
              image_count: record.image_count,
              user_id: record.user_id
            }))
          });
        }

        // Get images with detailed logging
        console.log('🔍 DEBUG: Fetching images for post:', selectedItem.id);
        const { data: imageData, error: imageError } = await supabase
          .from('linkedin_post_images')
          .select('*')
          .eq('post_id', selectedItem.id)
          .order('created_at', { ascending: true });

        if (imageError) {
          console.error('❌ DEBUG: Error loading images:', imageError);
          console.error('❌ DEBUG: Image error details:', {
            message: imageError.message,
            code: imageError.code,
            details: imageError.details,
            hint: imageError.hint
          });
        } else {
          console.log('✅ DEBUG: Loaded images successfully:', imageData);
          console.log('✅ DEBUG: Image data details:', {
            totalRecords: imageData?.length || 0,
            records: imageData?.map(record => ({
              id: record.id,
              post_id: record.post_id,
              variation_number: record.variation_number,
              user_id: record.user_id,
              hasImageData: !!record.image_data
            }))
          });
        }

        // Process each variation (1, 2, 3)
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          // Get count for this specific variation
          const countRecord = countData?.find(c => c.variation_number === variation);
          const count = countRecord?.image_count || 0;
          
          console.log(`📊 DEBUG: Variation ${variation} count:`, {
            variationKey,
            countRecord,
            finalCount: count
          });
          
          setImageCounts(prev => {
            const newCounts = {
              ...prev,
              [variationKey]: count
            };
            console.log('📊 DEBUG: Updated image counts state:', newCounts);
            return newCounts;
          });

          // Get images for this variation
          const variationImages = imageData?.filter(img => img.variation_number === variation) || [];
          
          const uniqueImages = variationImages.reduce((acc: string[], img) => {
            if (!acc.includes(img.image_data)) {
              acc.push(img.image_data);
            }
            return acc;
          }, []);
          
          setGeneratedImages(prev => {
            const newImages = {
              ...prev,
              [variationKey]: uniqueImages
            };
            console.log(`✅ DEBUG: Set ${uniqueImages.length} images for variation ${variation}:`, {
              variationKey,
              imageCount: uniqueImages.length,
              totalState: Object.keys(newImages).reduce((acc, key) => {
                acc[key] = newImages[key].length;
                return acc;
              }, {} as Record<string, number>)
            });
            return newImages;
          });
        }

      } catch (error) {
        console.error('❌ DEBUG: Error in loadExistingImagesAndCounts:', error);
      }
    };

    loadExistingImagesAndCounts();
  }, [selectedItem, getToken, clerkUserId]);

  // Real-time subscription for image updates and count changes
  useEffect(() => {
    if (!selectedItem) return;

    console.log(`🔔 DEBUG: Setting up real-time subscription for post ${selectedItem.id}`);

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
          console.log('🔔 DEBUG: Image table change detected:', payload);
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
          console.log('🔔 DEBUG: Count table change detected:', payload);
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
            console.log(`🔔 DEBUG: Received image broadcast for variation ${variation}:`, payload);
            handleImageBroadcast(payload.payload, variation);
          }
        )
        .subscribe();
      
      channels.push(broadcastChannel);
    }

    return () => {
      console.log(`🔔 DEBUG: Cleaning up real-time subscriptions for post ${selectedItem.id}`);
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [selectedItem]);

  const handleImageTableChange = async (payload: any) => {
    if (!selectedItem) return;
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    console.log('🔔 DEBUG: Processing image table change:', { eventType, newRecord, oldRecord });
    
    if (eventType === 'INSERT' && newRecord) {
      const variationKey = `${selectedItem.id}-${newRecord.variation_number}`;
      
      console.log('🔔 DEBUG: Adding new image to state:', {
        variationKey,
        imageData: newRecord.image_data ? 'present' : 'missing',
        recordId: newRecord.id
      });
      
      // Add the new image
      setGeneratedImages(prev => {
        const existingImages = prev[variationKey] || [];
        if (existingImages.includes(newRecord.image_data)) {
          console.log('🔔 DEBUG: Duplicate image detected, skipping');
          return prev;
        }
        const newImages = {
          ...prev,
          [variationKey]: [...existingImages, newRecord.image_data]
        };
        console.log('🔔 DEBUG: Updated images state:', {
          variationKey,
          newCount: newImages[variationKey].length,
          totalState: Object.keys(newImages).reduce((acc, key) => {
            acc[key] = newImages[key].length;
            return acc;
          }, {} as Record<string, number>)
        });
        return newImages;
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
    console.log('🔔 DEBUG: Processing count table change:', { eventType, newRecord });
    
    if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRecord) {
      const variationKey = `${selectedItem.id}-${newRecord.variation_number}`;
      
      console.log(`🔔 DEBUG: Count updated for ${variationKey}: ${newRecord.image_count}`);
      
      setImageCounts(prev => {
        const newCounts = {
          ...prev,
          [variationKey]: newRecord.image_count
        };
        console.log('🔔 DEBUG: Updated counts via real-time:', newCounts);
        return newCounts;
      });
    }
  };

  const refreshCountFromDatabase = async (postId: string, variationNumber: number) => {
    try {
      console.log(`🔄 DEBUG: Refreshing count for post ${postId}, variation ${variationNumber}`);
      
      const { data, error } = await supabase
        .from('linkedin_post_image_counts')
        .select('image_count')
        .eq('post_id', postId)
        .eq('variation_number', variationNumber)
        .maybeSingle();

      if (error) {
        console.error('🔄 DEBUG: Error refreshing count:', error);
      } else if (data) {
        const variationKey = `${postId}-${variationNumber}`;
        console.log(`🔄 DEBUG: Refreshed count for ${variationKey}: ${data.image_count}`);
        setImageCounts(prev => {
          const newCounts = {
            ...prev,
            [variationKey]: data.image_count
          };
          console.log('🔄 DEBUG: Updated counts after refresh:', newCounts);
          return newCounts;
        });
      } else {
        console.log(`🔄 DEBUG: No count record found for post ${postId}, variation ${variationNumber}`);
      }
    } catch (error) {
      console.error('❌ DEBUG: Error refreshing count:', error);
    }
  };

  const handleImageBroadcast = (payload: any, variation: number) => {
    if (!selectedItem || !payload) return;
    
    if (payload.post_id === selectedItem.id && payload.image_data) {
      const variationKey = `${selectedItem.id}-${variation}`;
      
      console.log(`🔔 DEBUG: Processing image broadcast for ${variationKey}:`, {
        hasImageData: !!payload.image_data,
        payloadKeys: Object.keys(payload)
      });
      
      // Add with deduplication
      setGeneratedImages(prev => {
        const existingImages = prev[variationKey] || [];
        if (existingImages.includes(payload.image_data)) {
          console.log('🔔 DEBUG: Duplicate image detected via broadcast, skipping');
          return prev;
        }
        const newImages = {
          ...prev,
          [variationKey]: [...existingImages, payload.image_data]
        };
        console.log(`🔔 DEBUG: Added new image via broadcast, total: ${newImages[variationKey].length}`);
        return newImages;
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

    console.log(`🚀 DEBUG: Attempting to generate image for ${variationKey}:`, {
      currentCount,
      limit: 3,
      canGenerate: currentCount < 3
    });

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
      console.log(`🚀 DEBUG: Triggering image generation webhook:`, {
        postId: item.id,
        postNumber,
        heading: heading ? 'present' : 'missing',
        content: content ? 'present' : 'missing',
        source: 'history'
      });
      
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
        console.error('❌ DEBUG: Supabase function error:', error);
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('✅ DEBUG: Edge function response:', data);

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
      console.error('❌ DEBUG: Error triggering image generation webhook:', error);
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
