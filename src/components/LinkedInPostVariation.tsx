import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLinkedInImageCreditCheck } from '@/hooks/useLinkedInImageCreditCheck';
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
  const { checkAndDeductForImage, isDeducting } = useLinkedInImageCreditCheck();
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);

  // Load existing images for this variation
  useEffect(() => {
    const loadExistingImages = async () => {
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
            const imageUrls = data.map(img => img.image_data);
            setGeneratedImages(imageUrls);
          }
        }, 3, `load existing images for variation ${variationNumber}`);
      } catch (err) {
        console.error('Error loading existing images:', err);
      }
    };

    loadExistingImages();
  }, [postId, variationNumber, isAuthReady, executeWithRetry]);

  // Real-time subscription for image updates
  useEffect(() => {
    if (!postId || !isAuthReady) return;

    const channel = supabase
      .channel(`linkedin-image-updates-${postId}-${variationNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'linkedin_post_images',
        filter: `post_id=eq.${postId}.and.variation_number=eq.${variationNumber}`
      }, async (payload) => {
        console.log('LinkedIn image updated via real-time:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newImage = payload.new;
          
          if (newImage.image_data === 'generating...') {
            setIsLoadingImage(true);
            setImageGenerationFailed(false);
          } else if (newImage.image_data && newImage.image_data !== 'generating...') {
            setIsLoadingImage(false);
            setImageGenerationFailed(false);
            
            // Add the new image to the list
            setGeneratedImages(prev => {
              const exists = prev.includes(newImage.image_data);
              return exists ? prev : [...prev, newImage.image_data];
            });
            
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for variation ${variationNumber} is ready.`
            });
          }
        } else if (payload.eventType === 'DELETE') {
          // Remove the deleted image from the list
          const deletedImage = payload.old;
          setGeneratedImages(prev => prev.filter(img => img !== deletedImage.image_data));
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
      console.error('Failed to copy text:', err);
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
      console.error('Failed to copy image: ', err);
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
      // Check and deduct credits before generating image
      const canProceed = await checkAndDeductForImage(postId, variationNumber);
      if (!canProceed) {
        setIsLoadingImage(false);
        return;
      }

      console.log(`Generating image for post ${postId}, variation ${variationNumber}`);
      
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .insert({
            post_id: postId,
            variation_number: variationNumber,
            image_data: 'generating...' // Placeholder that will be updated by webhook
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating image record:', error);
          throw error;
        }

        console.log('Image generation request created:', data);
      }, 3, `generate image for variation ${variationNumber}`);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated. This may take up to 2 minutes."
      });

    } catch (err: any) {
      console.error('Error generating image:', err);
      setIsLoadingImage(false);
      setImageGenerationFailed(true);
      
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
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
          console.error('Error deleting image:', error);
          throw error;
        }
      }, 3, `delete image for variation ${variationNumber}`);

      setGeneratedImages(prev => prev.filter(img => img !== imageData));
      
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
    <Card className="bg-gray-800 border-cyan-400/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-cyan-300 font-inter text-base flex items-center justify-between">
          <span>{heading}</span>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(content)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 h-8 text-xs whitespace-nowrap"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              onClick={handleGenerateImage}
              size="sm"
              disabled={isLoadingImage || isDeducting}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 px-3 py-1 h-8 text-xs whitespace-nowrap"
            >
              {isLoadingImage || isDeducting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3 mr-1" />
              )}
              {isLoadingImage ? 'Generating...' : isDeducting ? 'Processing...' : 'Get Image'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Loading indicator */}
        {isLoadingImage && (
          <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading for variation {variationNumber}...</div>
            <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
          </div>
        )}

        {/* Failed generation indicator */}
        {imageGenerationFailed && (
          <div className="p-3 bg-red-50 rounded-lg text-center border border-red-200">
            <div className="text-sm text-red-600 font-medium">Image generation failed for variation {variationNumber}</div>
            <div className="text-xs text-red-500 mt-1">Please try again</div>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-cyan-300 font-medium text-sm">Generated Images ({generatedImages.length}):</h5>
            <div className="space-y-3">
              {generatedImages.map((imageData, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageData} 
                    alt={`Generated LinkedIn post image ${index + 1} for variation ${variationNumber}`}
                    className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      onClick={() => copyImageToClipboard(imageData)}
                      size="sm"
                      className="bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteImage(imageData)}
                      size="sm"
                      className="bg-red-600/70 hover:bg-red-600/80 text-white p-1 h-auto min-h-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* LinkedIn Post Preview - Pass userData prop */}
        <LinkedInPostDisplay 
          content={content}
          userProfile={userProfile}
          userData={userData}
        />
      </CardContent>
    </Card>
  );
};

export default LinkedInPostVariation;
