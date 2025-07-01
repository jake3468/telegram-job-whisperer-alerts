
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up stuck 'generating...' records from LinkedIn post images
 * This prevents old stuck records from affecting the UI state
 */
export const cleanupStuckLinkedInImages = async (postId?: string) => {
  try {
    let query = supabase
      .from('linkedin_post_images')
      .delete()
      .eq('image_data', 'generating...')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes ago

    // If postId is provided, only clean up for that specific post
    if (postId) {
      query = query.eq('post_id', postId);
    }

    const { error, count } = await query;

    if (error) {
      console.error('Error cleaning up stuck LinkedIn images:', error);
      return false;
    }

    if (count && count > 0) {
      console.log(`🧹 Cleaned up ${count} stuck LinkedIn image records`);
    }

    return true;
  } catch (error) {
    console.error('Exception cleaning up stuck LinkedIn images:', error);
    return false;
  }
};

/**
 * Clean up stuck records for a specific post and variation
 */
export const cleanupStuckLinkedInImageForVariation = async (postId: string, variationNumber: number) => {
  try {
    const { error } = await supabase
      .from('linkedin_post_images')
      .delete()
      .eq('post_id', postId)
      .eq('variation_number', variationNumber)
      .eq('image_data', 'generating...');

    if (error) {
      console.error('Error cleaning up stuck LinkedIn image for variation:', error);
      return false;
    }

    console.log(`🧹 Cleaned up stuck LinkedIn image for post ${postId}, variation ${variationNumber}`);
    return true;
  } catch (error) {
    console.error('Exception cleaning up stuck LinkedIn image for variation:', error);
    return false;
  }
};
