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

/**
 * Remove duplicate images for a specific post and variation
 * Keeps only the most recent non-generating record
 */
export const removeDuplicateLinkedInImages = async (postId: string, variationNumber: number) => {
  try {
    // Get all records for this post and variation
    const { data: allRecords, error: fetchError } = await supabase
      .from('linkedin_post_images')
      .select('id, created_at, image_data')
      .eq('post_id', postId)
      .eq('variation_number', variationNumber)
      .neq('image_data', 'generating...')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching duplicate records:', fetchError);
      return false;
    }

    if (!allRecords || allRecords.length <= 1) {
      console.log('No duplicates found to clean up');
      return true;
    }

    // Keep the most recent record, delete the rest
    const recordsToDelete = allRecords.slice(1);
    const idsToDelete = recordsToDelete.map(record => record.id);

    const { error: deleteError } = await supabase
      .from('linkedin_post_images')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting duplicate records:', deleteError);
      return false;
    }

    console.log(`🧹 Removed ${recordsToDelete.length} duplicate LinkedIn image records for post ${postId}, variation ${variationNumber}`);
    return true;
  } catch (error) {
    console.error('Exception removing duplicate LinkedIn images:', error);
    return false;
  }
};
