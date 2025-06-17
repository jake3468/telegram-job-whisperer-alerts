import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Calendar, Trash2, Eye, X, AlertCircle, Copy, Share2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface LinkedInPostItem {
  id: string;
  topic?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  created_at: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
}

interface LinkedInPostsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

const LinkedInPostsHistoryModal = ({
  isOpen,
  onClose,
  gradientColors
}: LinkedInPostsHistoryModalProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [historyData, setHistoryData] = useState<LinkedInPostItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LinkedInPostItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string[]}>({});
  const [loadingImages, setLoadingImages] = useState<{[key: string]: boolean}>({});
  const [imageGenerationFailed, setImageGenerationFailed] = useState<{[key: string]: boolean}>({});
  const [imageCounts, setImageCounts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (isOpen && user && userProfile) {
      fetchHistory();
    }
  }, [isOpen, user, userProfile]);

  // Load existing images and counts for LinkedIn posts when item is selected
  useEffect(() => {
    if (!selectedItem) return;

    const loadExistingImagesAndCounts = async () => {
      try {
        for (let variation = 1; variation <= 3; variation++) {
          const { data: images, error } = await supabase
            .from('linkedin_post_images')
            .select('image_data')
            .eq('post_id', selectedItem.id)
            .eq('variation_number', variation)
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error loading existing images for variation ${variation}:`, error);
            continue;
          }

          if (images && images.length > 0) {
            const variationKey = `${selectedItem.id}-${variation}`;
            // Remove duplicates
            const uniqueImages = images.reduce((acc: string[], img) => {
              if (!acc.includes(img.image_data)) {
                acc.push(img.image_data);
              }
              return acc;
            }, []);
            
            setGeneratedImages(prev => ({
              ...prev,
              [variationKey]: uniqueImages
            }));
            
            // Set the actual count from database
            setImageCounts(prev => ({
              ...prev,
              [variationKey]: uniqueImages.length
            }));
          } else {
            // No images found, set count to 0
            const variationKey = `${selectedItem.id}-${variation}`;
            setImageCounts(prev => ({
              ...prev,
              [variationKey]: 0
            }));
          }
        }
      } catch (error) {
        console.error('Error loading existing images and counts:', error);
      }
    };

    loadExistingImagesAndCounts();
  }, [selectedItem]);

  // Set up real-time subscription for image updates in history
  useEffect(() => {
    if (!selectedItem) return;

    console.log(`Setting up history image subscription for post ${selectedItem.id}`);

    const channel = supabase
      .channel(`linkedin-image-history-${selectedItem.id}`)
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received history image broadcast:', payload);
          
          if (payload.payload?.post_id === selectedItem.id && payload.payload?.image_data) {
            const variationKey = `${selectedItem.id}-${payload.payload.variation_number}`;
            
            // Add with deduplication
            setGeneratedImages(prev => {
              const existingImages = prev[variationKey] || [];
              if (existingImages.includes(payload.payload.image_data)) {
                console.log('Duplicate image in history, skipping');
                return prev;
              }
              return {
                ...prev,
                [variationKey]: [...existingImages, payload.payload.image_data]
              };
            });

            setImageCounts(prev => ({
              ...prev,
              [variationKey]: payload.payload.image_count || ((prev[variationKey] || 0) + 1)
            }));
            
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
              description: `LinkedIn post image for Post ${payload.payload.variation_number} is ready.`
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`History image subscription status:`, status);
      });

    return () => {
      console.log(`Cleaning up history image subscription`);
      supabase.removeChannel(channel);
    };
  }, [selectedItem, toast]);

  // Enhanced polling for history images
  useEffect(() => {
    if (!selectedItem) return;

    const pollForImages = setInterval(async () => {
      try {
        for (let variation = 1; variation <= 3; variation++) {
          const variationKey = `${selectedItem.id}-${variation}`;
          
          if (loadingImages[variationKey]) {
            const { data: images, error } = await supabase
              .from('linkedin_post_images')
              .select('image_data')
              .eq('post_id', selectedItem.id)
              .eq('variation_number', variation)
              .order('created_at', { ascending: true });

            if (!error && images) {
              const uniqueImages = images.reduce((acc: string[], img) => {
                if (!acc.includes(img.image_data)) {
                  acc.push(img.image_data);
                }
                return acc;
              }, []);

              const currentImages = generatedImages[variationKey] || [];
              if (uniqueImages.length > currentImages.length) {
                console.log(`New images detected for ${variationKey}: ${uniqueImages.length} vs ${currentImages.length}`);
                
                setGeneratedImages(prev => ({
                  ...prev,
                  [variationKey]: uniqueImages
                }));
                
                setImageCounts(prev => ({
                  ...prev,
                  [variationKey]: uniqueImages.length
                }));
                
                setLoadingImages(prev => ({
                  ...prev,
                  [variationKey]: false
                }));
                
                toast({
                  title: "Image Generated!",
                  description: `LinkedIn post image for Post ${variation} is ready.`
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('History polling error:', error);
      }
    }, 3000);

    return () => {
      clearInterval(pollForImages);
    };
  }, [selectedItem, loadingImages, generatedImages, toast]);

  const fetchHistory = async () => {
    if (!user || !userProfile) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_linkedin')
        .select('id, topic, opinion, personal_story, audience, tone, created_at, post_heading_1, post_content_1, post_heading_2, post_content_2, post_heading_3, post_content_3')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching history:', error);
        throw error;
      }

      setHistoryData(data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = async (item: LinkedInPostItem, postNumber?: number) => {
    let result;
    
    if (postNumber) {
      // For LinkedIn posts, copy specific post content
      result = item[`post_content_${postNumber}` as keyof LinkedInPostItem] as string;
    }
    
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      const itemType = `LinkedIn post ${postNumber || ''}`;
      toast({
        title: "Copied!",
        description: `${itemType} copied to clipboard successfully.`
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

  const handleCopyImage = async (imageData: string, imageIndex: number) => {
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
        description: `Image ${imageIndex + 1} copied to clipboard successfully.`
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

  const handleGetImageForPost = async (item: LinkedInPostItem, postNumber: number) => {
    const variationKey = `${item.id}-${postNumber}`;
    const currentCount = imageCounts[variationKey] || 0;

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
      if (loadingImages[variationKey]) {
        setLoadingImages(prev => ({ ...prev, [variationKey]: false }));
        setImageGenerationFailed(prev => ({ ...prev, [variationKey]: true }));
        toast({
          title: "Image Generation Failed",
          description: "Image generation timed out after 2 minutes. Please try again.",
          variant: "destructive"
        });
      }
    }, 120000); // 2 minutes
    
    try {
      console.log(`Triggering image generation via edge function for post ${postNumber} from history`);
      
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
        console.error('Supabase function error:', error);
        clearTimeout(timeoutId);
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      console.log('Edge function response:', data);

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
      console.error('Error triggering image generation webhook:', error);
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

  const handleDelete = async (itemId: string) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found. Please try again.",
        variant: "destructive"
      });
      return;
    }
    try {
      console.log(`Attempting to delete LinkedIn post item with ID: ${itemId} for user profile: ${userProfile.id}`);
      
      const { error } = await supabase
        .from('job_linkedin')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userProfile.id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "LinkedIn post deleted successfully."
      });

      // Close details view if we deleted the currently viewed item
      if (selectedItem && selectedItem.id === itemId) {
        setShowDetails(false);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasResult = (item: LinkedInPostItem) => {
    return item.post_content_1 && item.post_content_2 && item.post_content_3;
  };

  if (showDetails && selectedItem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <Share2 className="w-5 h-5" />
              LinkedIn Post Details
              <Button 
                onClick={() => setShowDetails(false)} 
                size="sm" 
                className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm mx-[15px]"
              >
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Input Details Section */}
            <div className="rounded-lg p-4 border border-white/10 bg-blue-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Input Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Topic:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{selectedItem.topic}</p>
                  </div>
                </div>
                {selectedItem.opinion && (
                  <div>
                    <label className="text-cyan-200 text-sm font-semibold">Opinion:</label>
                    <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                      <p className="text-white text-sm">{selectedItem.opinion}</p>
                    </div>
                  </div>
                )}
                {selectedItem.personal_story && (
                  <div>
                    <label className="text-cyan-200 text-sm font-semibold">Personal Story:</label>
                    <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                      <p className="text-white text-sm">{selectedItem.personal_story}</p>
                    </div>
                  </div>
                )}
                {selectedItem.audience && (
                  <div>
                    <label className="text-cyan-200 text-sm font-semibold">Audience:</label>
                    <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                      <p className="text-white text-sm">{selectedItem.audience}</p>
                    </div>
                  </div>
                )}
                {selectedItem.tone && (
                  <div>
                    <label className="text-cyan-200 text-sm font-semibold">Tone:</label>
                    <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                      <p className="text-white text-sm">{selectedItem.tone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-cyan-200 text-sm font-semibold">Created:</label>
                  <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                    <p className="text-white text-sm">{formatDate(selectedItem.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Section */}
            {hasResult(selectedItem) && (
              <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    LinkedIn Post
                  </div>
                </h3>

                <div className="space-y-6">
                  {/* Post 1 */}
                  {selectedItem.post_content_1 && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex flex-col gap-2 mb-3">
                        <h4 className="text-lime-400 font-semibold text-sm">{selectedItem.post_heading_1}</h4>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => handleCopyResult(selectedItem, 1)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden xs:inline">Copy</span>
                          </Button>
                          <Button
                            onClick={() => handleGetImageForPost(selectedItem, 1)}
                            size="sm"
                            disabled={loadingImages[`${selectedItem.id}-1`] || (imageCounts[`${selectedItem.id}-1`] || 0) >= 3}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span className="hidden xs:inline">
                              {(imageCounts[`${selectedItem.id}-1`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-1`] ? 'Gen...' : 
                               `Img (${imageCounts[`${selectedItem.id}-1`] || 0}/3)`}
                            </span>
                            <span className="xs:hidden">
                              {(imageCounts[`${selectedItem.id}-1`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-1`] ? '...' : 
                               `${imageCounts[`${selectedItem.id}-1`] || 0}/3`}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Loading indicator */}
                      {loadingImages[`${selectedItem.id}-1`] && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
                          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
                        </div>
                      )}

                      {/* Failed generation indicator */}
                      {imageGenerationFailed[`${selectedItem.id}-1`] && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                          <div className="text-sm text-red-600 font-medium">Image generation failed</div>
                          <div className="text-xs text-red-500 mt-1">Please try again</div>
                        </div>
                      )}

                      {/* Generated Images */}
                      {generatedImages[`${selectedItem.id}-1`] && generatedImages[`${selectedItem.id}-1`].length > 0 && (
                        <div className="mb-4 space-y-3">
                          {generatedImages[`${selectedItem.id}-1`].map((imageData, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <img 
                                src={imageData} 
                                alt={`Generated LinkedIn post image ${imageIndex + 1}`}
                                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                              />
                              <Button
                                onClick={() => handleCopyImage(imageData, imageIndex)}
                                size="sm"
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Image {imageIndex + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {selectedItem.post_content_1}
                      </div>
                    </div>
                  )}

                  {/* Post 2 */}
                  {selectedItem.post_content_2 && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex flex-col gap-2 mb-3">
                        <h4 className="text-lime-400 font-semibold text-sm">{selectedItem.post_heading_2}</h4>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => handleCopyResult(selectedItem, 2)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden xs:inline">Copy</span>
                          </Button>
                          <Button
                            onClick={() => handleGetImageForPost(selectedItem, 2)}
                            size="sm"
                            disabled={loadingImages[`${selectedItem.id}-2`] || (imageCounts[`${selectedItem.id}-2`] || 0) >= 3}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span className="hidden xs:inline">
                              {(imageCounts[`${selectedItem.id}-2`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-2`] ? 'Gen...' : 
                               `Img (${imageCounts[`${selectedItem.id}-2`] || 0}/3)`}
                            </span>
                            <span className="xs:hidden">
                              {(imageCounts[`${selectedItem.id}-2`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-2`] ? '...' : 
                               `${imageCounts[`${selectedItem.id}-2`] || 0}/3`}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Loading indicator */}
                      {loadingImages[`${selectedItem.id}-2`] && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
                          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
                        </div>
                      )}

                      {imageGenerationFailed[`${selectedItem.id}-2`] && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                          <div className="text-sm text-red-600 font-medium">Image generation failed</div>
                          <div className="text-xs text-red-500 mt-1">Please try again</div>
                        </div>
                      )}

                      {generatedImages[`${selectedItem.id}-2`] && generatedImages[`${selectedItem.id}-2`].length > 0 && (
                        <div className="mb-4 space-y-3">
                          {generatedImages[`${selectedItem.id}-2`].map((imageData, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <img 
                                src={imageData} 
                                alt={`Generated LinkedIn post image ${imageIndex + 1}`}
                                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                              />
                              <Button
                                onClick={() => handleCopyImage(imageData, imageIndex)}
                                size="sm"
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Image {imageIndex + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {selectedItem.post_content_2}
                      </div>
                    </div>
                  )}

                  {/* Post 3 */}
                  {selectedItem.post_content_3 && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex flex-col gap-2 mb-3">
                        <h4 className="text-lime-400 font-semibold text-sm">{selectedItem.post_heading_3}</h4>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => handleCopyResult(selectedItem, 3)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden xs:inline">Copy</span>
                          </Button>
                          <Button
                            onClick={() => handleGetImageForPost(selectedItem, 3)}
                            size="sm"
                            disabled={loadingImages[`${selectedItem.id}-3`] || (imageCounts[`${selectedItem.id}-3`] || 0) >= 3}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 h-6 text-xs px-2 flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span className="hidden xs:inline">
                              {(imageCounts[`${selectedItem.id}-3`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-3`] ? 'Gen...' : 
                               `Img (${imageCounts[`${selectedItem.id}-3`] || 0}/3)`}
                            </span>
                            <span className="xs:hidden">
                              {(imageCounts[`${selectedItem.id}-3`] || 0) >= 3 ? 'Max' :
                               loadingImages[`${selectedItem.id}-3`] ? '...' : 
                               `${imageCounts[`${selectedItem.id}-3`] || 0}/3`}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Loading indicator */}
                      {loadingImages[`${selectedItem.id}-3`] && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                          <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
                          <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
                        </div>
                      )}

                      {imageGenerationFailed[`${selectedItem.id}-3`] && (
                        <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                          <div className="text-sm text-red-600 font-medium">Image generation failed</div>
                          <div className="text-xs text-red-500 mt-1">Please try again</div>
                        </div>
                      )}

                      {generatedImages[`${selectedItem.id}-3`] && generatedImages[`${selectedItem.id}-3`].length > 0 && (
                        <div className="mb-4 space-y-3">
                          {generatedImages[`${selectedItem.id}-3`].map((imageData, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <img 
                                src={imageData} 
                                alt={`Generated LinkedIn post image ${imageIndex + 1}`}
                                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto rounded-lg shadow-sm object-contain max-h-96"
                              />
                              <Button
                                onClick={() => handleCopyImage(imageData, imageIndex)}
                                size="sm"
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white p-1 h-auto min-h-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Image {imageIndex + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {selectedItem.post_content_3}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white font-inter flex items-center gap-2 text-base sm:text-lg">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            LinkedIn Posts History
          </DialogTitle>
          <DialogDescription className="text-white/70 font-inter text-xs sm:text-sm">
            Your history is automatically deleted after 60 days. Found {historyData.length} items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 sm:p-3 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-orange-200">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <p className="text-xs sm:text-sm">
              Your history is automatically deleted after 60 days for privacy and storage optimization.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-sm">Loading history...</div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <Share2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No LinkedIn posts found.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 pb-4">
              {historyData.map(item => (
                <div key={item.id} className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-indigo-800">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          <Share2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.topic || 'LinkedIn Post'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.tone || 'No tone specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 pt-2">
                      <Button 
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetails(true);
                        }} 
                        size="sm" 
                        className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        onClick={() => handleDelete(item.id)} 
                        size="sm" 
                        className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-xs px-2 py-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white font-medium truncate">
                          <Share2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.topic || 'LinkedIn Post'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.tone || 'No tone specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button 
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetails(true);
                        }} 
                        size="sm" 
                        className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-3 py-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        onClick={() => handleDelete(item.id)} 
                        size="sm" 
                        className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInPostsHistoryModal;
