import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, User, Copy, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCreditCheck } from '@/hooks/useCreditCheck';

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
  const navigate = useNavigate();
  const { hasCredits, creditBalance, showInsufficientCreditsPopup } = useCreditCheck(0.5);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationFailed, setImageGenerationFailed] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  
  // Use refs to track timeout state independently of React state
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isTimeoutActiveRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create display name from user data
  const displayName = userData?.first_name && userData?.last_name 
    ? `${userData.first_name} ${userData.last_name}` 
    : userData?.first_name 
    ? userData.first_name 
    : 'Professional User';

  // Load existing image from database
  useEffect(() => {
    if (!postId) return;

    const loadExistingImage = async () => {
      try {
        console.log(`🔍 DEBUG: Loading image for post ${postId}`);
        
        const { data: image, error } = await supabase
          .from('linkedin_post_images')
          .select('image_data')
          .eq('post_id', postId)
          .maybeSingle();

        console.log(`🔍 DEBUG: Image query result:`, { image, error });

        if (error) {
          console.error('Error loading existing image:', error);
          return;
        }

        if (image) {
          console.log(`🔍 DEBUG: Found existing image for post ${postId}`);
          setGeneratedImage(image.image_data);
          setHasImage(true);
        } else {
          console.log(`🔍 DEBUG: No existing image found for post ${postId}`);
          setHasImage(false);
        }

      } catch (error) {
        console.error('Error loading existing image:', error);
      }
    };

    loadExistingImage();
  }, [postId]);

  // Set up real-time subscription for image updates
  useEffect(() => {
    if (!postId) return;

    console.log(`Setting up image subscription for post ${postId}`);

    const channel = supabase
      .channel(`linkedin-image-${postId}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received image broadcast:', payload);
          
          if (payload.payload?.post_id === postId && payload.payload?.image_data) {
            console.log(`Image received for post ${postId}`);
            
            // Clear all timeouts and intervals when image is received
            if (timeoutIdRef.current) {
              clearTimeout(timeoutIdRef.current);
              timeoutIdRef.current = null;
            }
            if (pollIntervalRef.current) {
              clearTimeout(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            isTimeoutActiveRef.current = false;
            
            setGeneratedImage(payload.payload.image_data);
            setHasImage(true);
            setIsGeneratingImage(false);
            setImageGenerationFailed(false);
            
            toast({
              title: "Image Generated!",
              description: `LinkedIn post image is ready.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Image subscription status for post ${postId}:`, status);
      });

    return () => {
      console.log(`Cleaning up image subscription for post ${postId}`);
      // Clear any active timeouts on cleanup
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      isTimeoutActiveRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [postId, toast]);

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

  const handleCopyImage = async (imageData: string) => {
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
        description: "Image copied to clipboard successfully."
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
    if (hasImage) {
      toast({
        title: "Image Already Generated",
        description: "This LinkedIn post already has an image.",
        variant: "destructive"
      });
      return;
    }

    // Check if user has sufficient credits
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    setIsGeneratingImage(true);
    setImageGenerationFailed(false);
    isTimeoutActiveRef.current = true;
    
    // Set timeout for 2 minutes using useRef
    timeoutIdRef.current = setTimeout(() => {
      if (isTimeoutActiveRef.current) {
        console.log(`Image generation timeout for post ${postId}`);
        setIsGeneratingImage(false);
        setImageGenerationFailed(true);
        isTimeoutActiveRef.current = false;
        
        // Clear polling interval on timeout
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        toast({
          title: "Image Generation Failed",
          description: "Image generation timed out after 2 minutes. Please try again.",
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes

    try {
      console.log("Triggering image generation via edge function for post", postId);
      
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
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('Edge function response:', data);

      if (!data.success) {
        if (data.limit_exceeded) {
          setHasImage(true); // Mark as having image to disable button
          toast({
            title: "Generation Limit Exceeded",
            description: "This post already has an image generated.",
            variant: "destructive"
          });
        } else {
          throw new Error(data.error || 'Failed to trigger image generation');
        }
        
        // Clear timeout and reset state
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
          isTimeoutActiveRef.current = false;
        }
        setIsGeneratingImage(false);
        return;
      }

      // If the response already contains image data (immediate response)
      if (data.data && data.data.image_data) {
        console.log('Received immediate image data from edge function');
        
        // Clear timeout since we got immediate response
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
          isTimeoutActiveRef.current = false;
        }
        
        setGeneratedImage(data.data.image_data);
        setHasImage(true);
        setIsGeneratingImage(false);
        
        toast({
          title: "Image Generated!",
          description: "LinkedIn post image is ready."
        });
      } else {
        // Start fallback polling as backup to real-time
        console.log('Starting fallback polling for image generation');
        pollIntervalRef.current = setInterval(async () => {
          if (!isTimeoutActiveRef.current) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }
          
          try {
            console.log(`Polling for new image for post ${postId}`);
            const { data: image, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', postId)
              .maybeSingle();

            if (!error && image) {
              console.log('Found new image via polling for post', postId);
              
              // Clear timeout and interval
              if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
                isTimeoutActiveRef.current = false;
              }
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              
              setGeneratedImage(image.image_data);
              setHasImage(true);
              setIsGeneratingImage(false);
              setImageGenerationFailed(false);
              
              toast({
                title: "Image Generated!",
                description: "LinkedIn post image is ready."
              });
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
        }, 3000); // Poll every 3 seconds
      }

    } catch (error) {
      console.error('Error triggering image generation:', error);
      
      // Clear timeout on error
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
        isTimeoutActiveRef.current = false;
      }
      
      setIsGeneratingImage(false);
      setImageGenerationFailed(true);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger image generation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isImageGenerationDisabled = hasImage || isGeneratingImage;

  return (
    <div className="space-y-4 w-full">
      {/* Heading */}
      <div className="text-center">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 text-lime-400 px-1">{heading}</h3>
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

      {/* Action Buttons - Fixed responsive sizing and positioning */}
      <div className="flex flex-col gap-2 px-1">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          <Button 
            onClick={handleCopyContent} 
            className="flex items-center justify-center gap-1 h-8 sm:h-10 text-xs sm:text-sm font-semibold bg-emerald-300 hover:bg-emerald-200 text-gray-950 px-2 sm:px-4"
          >
            <Copy className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">Copy Post {variationNumber}</span>
          </Button>
          
          <Button 
            onClick={handleGetImage} 
            disabled={isImageGenerationDisabled}
            variant="outline" 
            className="flex items-center justify-center gap-1 h-8 sm:h-10 text-xs sm:text-sm border-teal-400/25 bg-amber-500 hover:bg-amber-400 text-gray-950 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-4"
          >
            <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">
              {hasImage ? 'Image Generated' : 
               isGeneratingImage ? 'Generating...' : 
               'Get Image'}
            </span>
          </Button>
        </div>
      </div>

      {/* Loading indicator for image generation */}
      {isGeneratingImage && (
        <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
        </div>
      )}

      {/* Failed generation indicator */}
      {imageGenerationFailed && (
        <div className="p-4 bg-red-50 rounded-lg text-center border border-red-200">
          <div className="text-sm text-red-600 font-medium">Image generation failed</div>
          <div className="text-xs text-red-500 mt-1">Please try again</div>
        </div>
      )}

      {/* Generated Image Display */}
      {generatedImage && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-cyan-300 px-1">Generated Image:</h4>
          <div className="relative">
            <img 
              src={generatedImage} 
              alt={`Generated image for ${heading}`}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
            />
            <Button
              onClick={() => handleCopyImage(generatedImage)}
              size="sm"
              className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInPostVariation;
