
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ImageIcon, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { supabase } from '@/integrations/supabase/client';
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
  const { hasCredits: hasImageCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5);
  const { deductCredits } = useDeferredCreditDeduction();
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  const [hasCreditBeenDeducted, setHasCreditBeenDeducted] = useState(false);

  // Real-time subscription for LinkedIn image updates
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`linkedin-image-updates-${postId}-${variationNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'linkedin_post_images',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('LinkedIn image updated:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const imageData = payload.new;
            
            // Only process images for this specific variation
            if (imageData.variation_number === variationNumber) {
              if (imageData.image_data && imageData.image_data !== 'generating...' && imageData.image_data !== 'placeholder') {
                // Image generation completed successfully
                setGeneratedImages(prev => {
                  const exists = prev.some(img => img === imageData.image_data);
                  return exists ? prev : [...prev, imageData.image_data];
                });
                setIsLoadingImage(false);
                setImageGenerationFailed(false);
                
                toast({
                  title: "Image Generated!",
                  description: `LinkedIn post image for variation ${variationNumber} has been created.`
                });
              } else if (imageData.image_data === 'generating...' || imageData.image_data === 'placeholder') {
                // Image is still being generated
                setIsLoadingImage(true);
                setImageGenerationFailed(false);
              }
            }
          }
        }
      )
      .subscribe();

    // Fetch existing images for this post and variation
    const fetchExistingImages = async () => {
      try {
        const { data, error } = await supabase
          .from('linkedin_post_images')
          .select('*')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber);

        if (error) {
          console.error('Error fetching existing images:', error);
          return;
        }

        if (data && data.length > 0) {
          const validImages = data
            .filter(img => img.image_data && img.image_data !== 'generating...' && img.image_data !== 'placeholder')
            .map(img => img.image_data);
          
          if (validImages.length > 0) {
            setGeneratedImages(validImages);
          }

          // Check if any images are still being generated
          const generatingImages = data.filter(img => img.image_data === 'generating...' || img.image_data === 'placeholder');
          if (generatingImages.length > 0) {
            setIsLoadingImage(true);
          }
        }
      } catch (error) {
        console.error('Error fetching existing images:', error);
      }
    };

    fetchExistingImages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, toast]);

  // Deferred credit deduction when image is successfully generated and displayed
  useEffect(() => {
    if (generatedImages.length > 0 && !hasCreditBeenDeducted) {
      const deductCreditsForImage = async () => {
        const success = await deductCredits(1.5, 'linkedin_image', `LinkedIn Image Generation - Variation ${variationNumber}`);
        if (success) {
          setHasCreditBeenDeducted(true);
          console.log(`Successfully deducted 1.5 credits for LinkedIn image generation - variation ${variationNumber}`);
        }
      };
      
      deductCreditsForImage();
    }
  }, [generatedImages.length, hasCreditBeenDeducted, variationNumber, deductCredits]);

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
    // Check credits before proceeding
    if (!hasImageCredits) {
      showInsufficientCreditsPopup();
      return;
    }

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
    setHasCreditBeenDeducted(false);

    try {
      console.log(`Generating image for post ${postId}, variation ${variationNumber}`);
      
      const { data, error } = await supabase
        .from('linkedin_post_images')
        .insert({
          post_id: postId,
          variation_number: variationNumber,
          image_data: 'placeholder' // This will be updated by the webhook
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating image record:', error);
        throw error;
      }

      console.log('Image generation request created:', data);
      
      toast({
        title: "Image Generation Started",
        description: "Your LinkedIn post image is being generated. This may take up to 2 minutes."
      });

    } catch (err: any) {
      console.error('Error generating image:', err);
      setImageGenerationFailed(true);
      setIsLoadingImage(false);
      
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (!postId) return;

    try {
      // Find and delete the image record from the database
      const { error } = await supabase
        .from('linkedin_post_images')
        .delete()
        .eq('post_id', postId)
        .eq('variation_number', variationNumber)
        .eq('image_data', generatedImages[imageIndex]);

      if (error) {
        console.error('Error deleting image:', error);
        toast({
          title: "Error",
          description: "Failed to delete image. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setGeneratedImages(prev => prev.filter((_, index) => index !== imageIndex));
      
      toast({
        title: "Image Deleted",
        description: "The image has been successfully deleted."
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
    <Card className="bg-gray-800 border-cyan-400/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-cyan-300 font-inter text-base flex items-center justify-between">
          <span>{heading}</span>
          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(content)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              onClick={handleGenerateImage}
              size="sm"
              disabled={isLoadingImage || !hasImageCredits}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              {isLoadingImage ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3 mr-1" />
              )}
              {isLoadingImage ? 'Generating...' : 'Get Image'}
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
                      onClick={() => handleDeleteImage(index)}
                      size="sm"
                      className="bg-red-600/70 hover:bg-red-600/80 text-white p-1 h-auto min-h-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* LinkedIn Post Preview */}
        <LinkedInPostDisplay 
          content={content}
          userProfile={userProfile}
        />
      </CardContent>
    </Card>
  );
};

export default LinkedInPostVariation;
