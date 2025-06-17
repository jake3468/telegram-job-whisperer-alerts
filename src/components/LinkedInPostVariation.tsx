
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, User, Copy, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  const [imageCount, setImageCount] = useState(0);

  // Create display name from user data
  const displayName = userData?.first_name && userData?.last_name 
    ? `${userData.first_name} ${userData.last_name}` 
    : userData?.first_name 
    ? userData.first_name 
    : 'Professional User';

  // Load existing images from database
  useEffect(() => {
    if (!postId) return;

    const loadExistingImages = async () => {
      try {
        const { data: images, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .eq('variation_number', variationNumber)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading existing images:', error);
          return;
        }

        if (images && images.length > 0) {
          setGeneratedImages(images.map(img => img.image_data));
          setImageCount(images.length);
        }
      } catch (error) {
        console.error('Error loading existing images:', error);
      }
    };

    loadExistingImages();
  }, [postId, variationNumber]);

  // Set up real-time subscription for image updates
  useEffect(() => {
    if (!postId) return;

    console.log(`Setting up image subscription for post ${postId}, variation ${variationNumber}`);

    const channel = supabase
      .channel(`linkedin-image-${postId}-${variationNumber}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received image broadcast:', payload);
          
          if (payload.payload?.variation_number === variationNumber && 
              payload.payload?.post_id === postId &&
              payload.payload?.image_data) {
            
            console.log(`Image received for variation ${variationNumber}`);
            setGeneratedImages(prev => [...prev, payload.payload.image_data]);
            setImageCount(payload.payload.image_count || (prev => prev + 1));
            setIsGeneratingImage(false);
            setImageGenerationFailed(false);
            
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image for Post ${variationNumber} is ready.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Image subscription status for variation ${variationNumber}:`, status);
      });

    return () => {
      console.log(`Cleaning up image subscription for variation ${variationNumber}`);
      supabase.removeChannel(channel);
    };
  }, [postId, variationNumber, toast]);

  const handleCopyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: `Post ${variationNumber} content copied to clipboard successfully.`
      });
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleCopyImage = async (imageData: string, index: number) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      toast({
        title: "Image Copied!",
        description: `Image ${index + 1} copied to clipboard successfully.`
      });
    } catch (err) {
      console.error('Failed to copy image:', err);
      toast({
        title: "Error",
        description: "Failed to copy image to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleGetImage = async () => {
    if (imageCount >= 3) {
      toast({
        title: "Limit Reached",
        description: "Maximum 3 images allowed per post variation.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(true);
    setImageGenerationFailed(false);
    
    // Set timeout for 2 minutes
    const timeoutId = setTimeout(() => {
      if (isGeneratingImage) {
        setIsGeneratingImage(false);
        setImageGenerationFailed(true);
        toast({
          title: "Image Generation Failed",
          description: "Image generation timed out after 2 minutes. Please try again.",
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes

    try {
      console.log("Triggering image generation via edge function for post", variationNumber);
      
      const { data, error } = await supabase.functions.invoke('linkedin-image-webhook', {
        body: {
          post_heading: heading,
          post_content: content,
          variation_number: variationNumber,
          user_name: displayName,
          post_id: postId,
          source: 'result_page'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('Edge function response:', data);

      if (!data.success) {
        clearTimeout(timeoutId);
        if (data.limit_exceeded) {
          setImageCount(3); // Set to max to disable further attempts
          toast({
            title: "Generation Limit Exceeded",
            description: "Maximum 3 images allowed per post variation.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error || 'Failed to trigger image generation');
        }
        setIsGeneratingImage(false);
        return;
      }

      toast({
        title: "Image Generation Started",
        description: `LinkedIn post image for Post ${variationNumber} is being generated...`
      });

    } catch (error) {
      console.error('Error triggering image generation:', error);
      clearTimeout(timeoutId);
      setIsGeneratingImage(false);
      setImageGenerationFailed(true);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger image generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isImageGenerationDisabled = imageCount >= 3 || isGeneratingImage;

  return (
    <div className="space-y-4 w-full">
      {/* Heading */}
      <div className="text-center">
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-lime-400">{heading}</h3>
      </div>

      {/* LinkedIn Post Preview */}
      <Card className="bg-white border border-slate-200 shadow-sm w-full max-w-none">
        <CardContent className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-900 text-sm truncate">{displayName}</h4>
                <p className="text-xs text-slate-500">Professional • 1st</p>
                <p className="text-xs text-slate-500">2m • 🌐</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 p-1 flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </div>
          </div>

          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="mb-4 space-y-3">
              {generatedImages.map((imageData, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageData} 
                    alt={`Generated image ${index + 1} for ${heading}`}
                    className="w-full rounded-lg shadow-sm"
                  />
                  <Button
                    onClick={() => handleCopyImage(imageData, index)}
                    size="sm"
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Image {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator for image generation */}
          {isGeneratingImage && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
              <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
            </div>
          )}

          {/* Failed generation indicator */}
          {imageGenerationFailed && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg text-center border border-red-200">
              <div className="text-sm text-red-600 font-medium">Image generation failed</div>
              <div className="text-xs text-red-500 mt-1">Please try again</div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between py-2 border-t border-b border-slate-100 mb-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="w-2 h-2 text-white fill-white" />
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">👏</span>
                </div>
              </div>
              <span className="hidden sm:inline">12 reactions</span>
              <span className="sm:hidden">12</span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="hidden sm:inline">3 comments • 1 repost</span>
              <span className="sm:hidden">3 • 1</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-1">
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-1 sm:gap-2 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-2">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-1 sm:gap-2 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-2">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-1 sm:gap-2 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-2">
              <Repeat2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Repost</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-1 sm:gap-2 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-2">
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleCopyContent} 
          className="flex-1 flex items-center justify-center gap-2 text-sm h-10 font-semibold bg-emerald-300 hover:bg-emerald-200 text-gray-950"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy Post {variationNumber}</span>
          <span className="sm:hidden">Copy</span>
        </Button>
        
        <Button 
          onClick={handleGetImage} 
          disabled={isImageGenerationDisabled}
          variant="outline" 
          className="flex-1 border-teal-400/25 text-sm h-10 bg-amber-500 hover:bg-amber-400 text-gray-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">
            {imageCount >= 3 ? 'Limit Exceeded' : 
             isGeneratingImage ? 'Generating...' : 
             `Get Image (${imageCount}/3)`}
          </span>
          <span className="sm:hidden">
            {imageCount >= 3 ? 'Limit' : 
             isGeneratingImage ? 'Gen...' : 
             `Image (${imageCount}/3)`}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default LinkedInPostVariation;
