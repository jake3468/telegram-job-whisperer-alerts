
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);

  const { n8nImages } = useN8NImageDisplay(postId || '', variationNumber, () => {
    setIsLoadingImage(false);
    setImageGenerationFailed(false);
  });

  const allImages = [...generatedImages, ...n8nImages];

  const checkAndLoadExistingImages = async () => {
    if (!postId || !isAuthReady) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber);

        if (error) {
          return;
        }

        if (data && data.length > 0) {
          const imageUrls = data
            .map(img => img.image_data)
            .filter(imageData => imageData && imageData !== 'generating...' && !imageData.includes('failed'));
          
          if (imageUrls.length > 0) {
            setGeneratedImages(imageUrls);
            setIsLoadingImage(false);
            setImageGenerationFailed(false);
          }
        }
      }, 1, `check existing images for variation ${variationNumber}`);
    } catch (err) {
      // Silent fail for existing image check
    }
  };

  useEffect(() => {
    checkAndLoadExistingImages();
  }, [postId, variationNumber, isAuthReady]);

  useEffect(() => {
    if (!postId || !isAuthReady) return;

    const channel = supabase
      .channel(`linkedin-image-updates-${postId}-${variationNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new;
          
          if (newImage.variation_number !== variationNumber) {
            return;
          }
          
          if (newImage.image_data === 'generating...') {
            setIsLoadingImage(true);
            setImageGenerationFailed(false);
          } 
          else if (newImage.image_data && 
                   newImage.image_data !== 'generating...' && 
                   !newImage.image_data.includes('failed')) {
            
            const isValidImage = newImage.image_data.startsWith('data:image/') || 
                                newImage.image_data.startsWith('http');
            
            if (isValidImage) {
              setIsLoadingImage(false);
              setImageGenerationFailed(false);
              
              setGeneratedImages(prev => {
                const exists = prev.includes(newImage.image_data);
                if (exists) {
                  return prev;
                }
                return [...prev, newImage.image_data];
              });
              
              toast({
                title: "Image Generated!",
                description: `LinkedIn post image for variation ${variationNumber} is ready.`
              });
            } else {
              setIsLoadingImage(false);
              setImageGenerationFailed(true);
            }
          } 
          else if (newImage.image_data && newImage.image_data.includes('failed')) {
            setIsLoadingImage(false);
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
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, isAuthReady, toast]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoadingImage) {
      timeoutId = setTimeout(() => {
        setIsLoadingImage(false);
        setImageGenerationFailed(true);
        toast({
          title: "Image Generation Timeout",
          description: `Image generation took too long for variation ${variationNumber}. Please try again.`,
          variant: "destructive"
        });
      }, 180000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoadingImage, variationNumber, toast]);

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

    setIsLoadingImage(true);
    setImageGenerationFailed(false);

    try {
      await executeWithRetry(async () => {
        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('linkedin-image-webhook', {
          body: {
            post_id: postId,
            post_heading: heading,
            post_content: content,
            variation_number: variationNumber,
            source: 'linkedin_post_variation'
          }
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

      }, 1, `generate image for variation ${variationNumber}`);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated..."
      });

    } catch (err: any) {
      setIsLoadingImage(false);
      setImageGenerationFailed(true);
      
      let errorMessage = "Failed to generate image. Please try again.";
      if (err.message.includes('not configured')) {
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
          throw error;
        }
      }, 1, `delete image for variation ${variationNumber}`);

      setGeneratedImages(prev => prev.filter(img => img !== imageData));
      
      toast({
        title: "Image Deleted",
        description: `Image for variation ${variationNumber} has been deleted.`
      });

    } catch (err) {
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
      {isLoadingImage && allImages.length === 0 && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200 mb-6">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading for variation {variationNumber}...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator */}
      {imageGenerationFailed && allImages.length === 0 && (
        <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200 mb-6">
          <div className="text-sm text-red-600 font-medium">Image generation failed for variation {variationNumber}</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Images */}
      {allImages.length > 0 && (
        <div className="mb-8">
          <h5 className="text-cyan-400 font-medium text-sm mb-4 text-center">
            Generated Images for Variation {variationNumber} ({allImages.length}):
            {n8nImages.length > 0 && <span className="text-green-400 ml-2">✨ N8N: {n8nImages.length}</span>}
            {generatedImages.length > 0 && <span className="text-blue-400 ml-2">📦 DB: {generatedImages.length}</span>}
          </h5>
          <div className="space-y-6">
            {allImages.map((imageData, index) => (
              <div key={index} className="relative w-full max-w-2xl mx-auto">
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
