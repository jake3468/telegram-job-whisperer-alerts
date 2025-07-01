
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import LinkedInPostDisplay from './LinkedInPostDisplay';

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

interface LinkedInImageData {
  id: string;
  image_data: string;
  variation_number: number;
  created_at: string;
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
  
  const [images, setImages] = useState<LinkedInImageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get images for this specific variation
  const generatedImages = images
    .filter(img => img.variation_number === variationNumber && img.image_data !== 'generating...')
    .map(img => img.image_data);

  const isLoadingImage = isGenerating || images.some(img => 
    img.variation_number === variationNumber && img.image_data === 'generating...'
  );

  // Fetch images when component mounts or postId changes
  const fetchImages = async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('*')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching images:', error);
          return;
        }

        if (data) {
          setImages(data);
        }
      }, 3, 'fetch LinkedIn post images');
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  // Set up real-time subscription for image updates
  useEffect(() => {
    if (!postId || !isAuthReady) return;

    // Initial fetch
    fetchImages();

    const channel = supabase
      .channel(`linkedin-images-${postId}-${variationNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        console.log('LinkedIn image updated via real-time:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new as LinkedInImageData;
          
          // Only process images for this variation
          if (newImage.variation_number !== variationNumber) {
            return;
          }
          
          setImages(prev => {
            const existing = prev.find(img => img.id === newImage.id);
            if (existing) {
              return prev.map(img => img.id === newImage.id ? newImage : img);
            } else {
              return [...prev, newImage];
            }
          });

          // Handle loading state changes based on image data
          if (newImage.image_data !== 'generating...' && newImage.variation_number === variationNumber) {
            setIsGenerating(false);
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for variation ${variationNumber} is ready.`
            });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedImage = payload.old as LinkedInImageData;
          if (deletedImage.variation_number === variationNumber) {
            setImages(prev => prev.filter(img => img.id !== deletedImage.id));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, isAuthReady, toast]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "The LinkedIn post has been copied to your clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

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
      toast({
        title: "Copy failed",
        description: "Please try right-clicking and copying the image manually.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateImage = async () => {
    if (!postId) {
      toast({
        title: "Error",
        description: "Post ID not found. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Set generating state immediately when user clicks
    setIsGenerating(true);

    try {
      await executeWithRetry(async () => {
        // Create placeholder record using upsert to prevent duplicates
        const { error } = await supabase
          .from('linkedin_post_images')
          .upsert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...'
          }, {
            onConflict: 'post_id,variation_number',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error creating image record:', error);
          throw error;
        }

        // Call webhook with proper parameters
        const webhookBody = {
          post_id: postId,
          variation_number: variationNumber,
          source: 'linkedin_post_variation',
          post_heading: heading,
          post_content: content
        };

        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('linkedin-image-webhook', {
          body: webhookBody
        });

        if (webhookError) {
          throw new Error(`Edge function failed: ${webhookError.message}`);
        }

        if (webhookResponse && webhookResponse.success === false) {
          if (!webhookResponse.webhook_url_configured) {
            throw new Error('Image generation service not configured');
          } else {
            throw new Error(webhookResponse.error || 'Edge function execution failed');
          }
        }

      }, 3, `generate image for variation ${variationNumber}`);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated..."
      });

    } catch (err: any) {
      setIsGenerating(false);
      
      let errorMessage = "Failed to generate image. Please try again.";
      if (err.message.includes('not configured')) {
        errorMessage = "Image generation service is not configured. Please contact support.";
      } else if (err.message.includes('Edge function execution failed')) {
        errorMessage = "Image generation service is temporarily unavailable. Please try again later.";
      } else if (err.message.includes('Session expired')) {
        errorMessage = "Your session has expired. Please refresh the page.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await executeWithRetry(async () => {
        const { error } = await supabase
          .from('linkedin_post_images')
          .delete()
          .eq('id', imageId);

        if (error) {
          console.error('Error deleting image:', error);
          throw error;
        }
      }, 3, `delete image ${imageId}`);

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId));
      setIsGenerating(false);

      toast({
        title: "Image Deleted",
        description: `Image for variation ${variationNumber} has been deleted.`
      });

    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Post Heading */}
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
            disabled={isLoadingImage}
            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 px-6 py-2 font-medium"
          >
            {isLoadingImage ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2" />
            )}
            {isLoadingImage ? 'Generating...' : 'Get Image'}
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoadingImage && generatedImages.length === 0 && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200 mb-6">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading for variation {variationNumber}...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="mb-8">
          <h5 className="text-cyan-400 font-medium text-sm mb-4 text-center">
            Generated Images for Variation {variationNumber} ({generatedImages.length}):
          </h5>
          <div className="space-y-6">
            {generatedImages.map((imageData, index) => {
              const imageRecord = images.find(img => img.image_data === imageData);
              return (
                <div key={`${imageData}-${index}`} className="relative w-full max-w-2xl mx-auto">
                  <img 
                    src={imageData} 
                    alt={`Generated LinkedIn post image ${index + 1} for variation ${variationNumber}`}
                    className="w-full rounded-lg shadow-lg object-contain"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      onClick={() => copyImageToClipboard(imageData)}
                      size="sm"
                      className="bg-black/70 hover:bg-black/80 text-white p-2 h-8 w-8"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {imageRecord && (
                      <Button
                        onClick={() => deleteImage(imageRecord.id)}
                        size="sm"
                        className="bg-red-600/70 hover:bg-red-600/80 text-white p-2 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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
