
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import LinkedInPostDisplay from './LinkedInPostDisplay';
import { useN8NImageDisplay } from '@/hooks/useN8NImageDisplay';

interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  created_at: string | null;
}

interface UserData {
  first_name: string | null;
  last_name: string | null;
}

interface LinkedInPostVariationProps {
  heading: string;
  content: string;
  userProfile?: UserProfile | null;
  userData?: UserData | null;
  variationNumber: number;
  postId?: string;
}

const LinkedInPostVariation = ({
  heading,
  content,
  userProfile,
  userData,
  variationNumber,
  postId
}: LinkedInPostVariationProps) => {
  const { toast } = useToast();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  // User-triggered loading state - only set when user clicks "Get Image"
  const [isUserLoadingImage, setIsUserLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  // Track if images exist for this post_id + variation_number to disable button
  const [hasExistingImages, setHasExistingImages] = useState(false);

  // Add N8N image display hook
  const { n8nImages } = useN8NImageDisplay(postId || '', variationNumber);

  // Combine both regular images and N8N images
  const allImages = [...generatedImages, ...n8nImages];

  // Reset loading state when N8N images arrive or regular images are loaded
  useEffect(() => {
    if ((n8nImages.length > 0 || generatedImages.length > 0) && isUserLoadingImage) {
      console.log(`🎯 Images detected, resetting loading state for variation ${variationNumber}`);
      setIsUserLoadingImage(false);
      setImageGenerationFailed(false);
    }
  }, [n8nImages.length, generatedImages.length, isUserLoadingImage, variationNumber]);

  // Function to check and load existing images
  const checkAndLoadExistingImages = useCallback(async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .neq('image_data', 'generating...');

        if (error) {
          console.error('Error loading existing images:', error);
          return;
        }

        if (data && data.length > 0) {
          const imageUrls = data.map(img => img.image_data).filter(img => img.trim());
          console.log(`🖼️ Found ${imageUrls.length} existing images for variation ${variationNumber}`);
          setGeneratedImages(imageUrls);
          setHasExistingImages(true); // Disable button when images exist
        } else {
          setHasExistingImages(false); // Enable button when no images exist
        }
      }, 3, `check existing images for variation ${variationNumber}`);
    } catch (err) {
      console.error('Error checking existing images:', err);
    }
  }, [postId, variationNumber, isAuthReady, executeWithRetry]);

  // Load existing images on component mount
  useEffect(() => {
    checkAndLoadExistingImages();
  }, [checkAndLoadExistingImages]);

  // Real-time subscription for image updates
  useEffect(() => {
    if (!postId || !isAuthReady) return;

    console.log(`📡 Setting up real-time subscription for post ${postId}, variation ${variationNumber}`);

    const channel = supabase
      .channel(`linkedin-image-updates-${postId}-${variationNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        console.log('📡 LinkedIn image updated via real-time:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new;
          
          // Check if this update is for our specific variation
          if (newImage.variation_number !== variationNumber) {
            console.log(`📡 Ignoring image for variation ${newImage.variation_number}, expecting ${variationNumber}`);
            return;
          }
          
          // Only process completed images (not 'generating...')
          if (newImage.image_data && 
              newImage.image_data !== 'generating...' && 
              !newImage.image_data.includes('failed') &&
              newImage.image_data.trim()) {
            
            console.log(`✅ Image generation completed for variation ${variationNumber}`);
            
            // Enhanced validation for base64 images
            const isValidBase64Image = newImage.image_data.startsWith('data:image/') && 
                                     newImage.image_data.includes('base64,') &&
                                     newImage.image_data.length > 5000;
            
            const isValidUrl = newImage.image_data.startsWith('http');
            
            if (isValidBase64Image || isValidUrl) {
              console.log(`📡 Valid image detected, updating state for variation ${variationNumber}`);
              
              // Reset loading states when image arrives
              setIsUserLoadingImage(false);
              setImageGenerationFailed(false);
              
              // Add new image and mark as having existing images
              setGeneratedImages(prev => {
                console.log(`📡 Adding new generated image for variation ${variationNumber}`);
                const newImages = [...prev, newImage.image_data];
                return newImages;
              });
              setHasExistingImages(true); // Disable button after image is generated
              
              toast({
                title: "Image Generated!",
                description: `LinkedIn post image for variation ${variationNumber} is ready.`
              });
            } else {
              console.log(`❌ Invalid image data format for variation ${variationNumber}`);
              setIsUserLoadingImage(false);
              setImageGenerationFailed(true);
            }
          } 
          else if (newImage.image_data && newImage.image_data.includes('failed')) {
            console.log(`❌ Image generation failed for variation ${variationNumber}`);
            setIsUserLoadingImage(false);
            setImageGenerationFailed(true);
            toast({
              title: "Image Generation Failed",
              description: `Failed to generate image for variation ${variationNumber}. Please try again.`,
              variant: "destructive"
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old;
          if (deletedImage.variation_number === variationNumber) {
            setGeneratedImages(prev => prev.filter(img => img !== deletedImage.image_data));
            // Update hasExistingImages based on remaining images
            setGeneratedImages(currentImages => {
              const updatedImages = currentImages.filter(img => img !== deletedImage.image_data);
              setHasExistingImages(updatedImages.length > 0);
              return updatedImages;
            });
          }
        }
      })
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status for variation ${variationNumber}:`, status);
      });

    return () => {
      console.log(`🧹 Cleaning up real-time subscription for variation ${variationNumber}`);
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, isAuthReady, toast]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "The LinkedIn post has been copied to your clipboard."
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  // Copy image to clipboard
  const copyImageToClipboard = async (imageData: string) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast({
        title: "Image copied!",
        description: "The image has been copied to your clipboard."
      });
    } catch (err) {
      console.error('Failed to copy image: ', err);
      toast({
        title: "Copy failed",
        description: "Please try right-clicking and copying the image manually.",
        variant: "destructive"
      });
    }
  };

  // Handle image generation - User-action driven
  const handleGenerateImage = async () => {
    if (!postId) {
      toast({
        title: "Error",
        description: "Post ID not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Don't allow generation if images already exist
    if (hasExistingImages) {
      toast({
        title: "Image Already Generated",
        description: "An image has already been generated for this post variation.",
        variant: "destructive"
      });
      return;
    }

    console.log(`🚀 User triggered image generation for post ${postId}, variation ${variationNumber}`);
    
    // Set user-triggered loading state
    setIsUserLoadingImage(true);
    setImageGenerationFailed(false);

    // Set timeout to reset loading state after 3 minutes
    const timeoutId = setTimeout(() => {
      setIsUserLoadingImage(false);
      setImageGenerationFailed(true);
      toast({
        title: "Image Generation Timeout",
        description: `Image generation took too long for variation ${variationNumber}. Please try again.`,
        variant: "destructive"
      });
    }, 180000);

    try {
      await executeWithRetry(async () => {
        console.log('🔗 Calling linkedin-image-webhook edge function...');
        const userName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 'Professional User';
        
        // Create a new "generating..." record for this variation
        const { error: insertError } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...'
          });

        if (insertError) {
          console.error('Error creating generating record:', insertError);
          throw insertError;
        }
        
        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('linkedin-image-webhook', {
          body: {
            post_id: postId,
            post_heading: heading,
            post_content: content,
            variation_number: variationNumber,
            user_name: userName,
            source: 'linkedin_post_variation'
          }
        });

        if (webhookError) {
          console.error('❌ Edge function error:', webhookError);
          throw new Error(`Edge function failed: ${webhookError.message}`);
        }

        console.log('✅ Edge function response:', webhookResponse);

        if (webhookResponse && webhookResponse.success === false) {
          if (!webhookResponse.webhook_url_configured) {
            throw new Error('N8N webhook URL not configured');
          } else {
            throw new Error(webhookResponse.error || 'Edge function execution failed');
          }
        }

        console.log('🎉 Image generation request sent successfully');
        clearTimeout(timeoutId);

      }, 3, `generate image for variation ${variationNumber}`);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated via N8N..."
      });

    } catch (err: any) {
      console.error('❌ Error in handleGenerateImage:', err);
      clearTimeout(timeoutId);
      setIsUserLoadingImage(false);
      setImageGenerationFailed(true);
      
      let errorMessage = "Failed to generate image. Please try again.";
      if (err.message.includes('webhook URL not configured')) {
        errorMessage = "Image generation service is not configured. Please contact support.";
      } else if (err.message.includes('Edge function execution failed')) {
        errorMessage = "Image generation service is temporarily unavailable. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Delete image
  const deleteImage = async (imageData: string) => {
    if (!postId) return;

    try {
      await executeWithRetry(async () => {
        const { error } = await supabase
          .from('linkedin_post_images')
          .delete()
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .eq('image_data', imageData);

        if (error) {
          console.error('Error deleting image:', error);
          throw error;
        }
      }, 3, `delete image for variation ${variationNumber}`);

      setGeneratedImages(prev => prev.filter(img => img !== imageData));
      
      // Check if there are any remaining images after deletion
      setGeneratedImages(prev => {
        const remainingImages = prev.filter(img => img !== imageData);
        setHasExistingImages(remainingImages.length > 0);
        return remainingImages;
      });
      
      toast({
        title: "Image Deleted",
        description: `Image for variation ${variationNumber} has been deleted.`
      });

    } catch (err) {
      console.error('Error deleting image:', err);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Post Heading - Smaller and Clearer */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg mb-4">
          <h3 className="text-base font-semibold text-center break-words">
            Post Variation {variationNumber}: {heading}
          </h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => copyToClipboard(content)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 font-medium"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Post
          </Button>
          <Button
            onClick={handleGenerateImage}
            size="sm"
            disabled={isUserLoadingImage || hasExistingImages}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 px-6 py-2 font-medium"
          >
            {isUserLoadingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : hasExistingImages ? (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Image Generated</span>
                <span className="sm:hidden">Generated</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Get Image</span>
                <span className="sm:hidden">Get Img</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading indicator - only show when user triggered loading and no images exist */}
      {isUserLoadingImage && allImages.length === 0 && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200 mb-6">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading for variation {variationNumber}...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator - only show when failed and no images exist */}
      {imageGenerationFailed && allImages.length === 0 && (
        <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200 mb-6">
          <div className="text-sm text-red-600 font-medium">Image generation failed for variation {variationNumber}</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Images - Show both regular and N8N images */}
      {allImages.length > 0 && (
        <div className="mb-8">
          <h5 className="text-cyan-400 font-medium text-sm mb-4 text-center">
            Generated Images for Variation {variationNumber} ({allImages.length}):
            {n8nImages.length > 0 && <span className="text-green-400 ml-2">✨ N8N: {n8nImages.length}</span>}
          </h5>
          <div className="space-y-6">
            {allImages.map((imageData, index) => (
              <div key={index} className="relative w-full max-w-2xl mx-auto">
                <img 
                  src={imageData} 
                  alt={`Generated LinkedIn post image ${index + 1} for variation ${variationNumber}`}
                  className="w-full rounded-lg shadow-lg object-contain"
                  onLoad={() => console.log(`🖼️ Image ${index + 1} loaded successfully for variation ${variationNumber}`)}
                  onError={(e) => console.error(`❌ Failed to load image ${index + 1} for variation ${variationNumber}`, e)}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    onClick={() => copyImageToClipboard(imageData)}
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white p-2 h-8 w-8"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteImage(imageData)}
                    size="sm"
                    className="bg-red-600/70 hover:bg-red-600/80 text-white p-2 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn Post Preview */}
      <div className="w-full">
        <LinkedInPostDisplay 
          content={content}
          userProfile={userProfile}
          userData={userData}
        />
      </div>
    </div>
  );
};

export default LinkedInPostVariation;
