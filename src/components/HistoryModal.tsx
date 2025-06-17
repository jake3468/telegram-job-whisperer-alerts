import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, X, AlertCircle, Copy, Share2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import PercentageMeter from '@/components/PercentageMeter';
import CoverLetterDownloadActions from '@/components/CoverLetterDownloadActions';

interface HistoryItem {
  id: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  topic?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  created_at: string;
  job_match?: string;
  match_score?: string;
  cover_letter?: string;
  linkedin_post?: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
}

interface HistoryModalProps {
  type: 'job_analyses' | 'cover_letters' | 'linkedin_posts';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

const HistoryModal = ({
  type,
  isOpen,
  onClose,
  gradientColors
}: HistoryModalProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
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

  // Load existing images for LinkedIn posts when item is selected
  useEffect(() => {
    if (!selectedItem || type !== 'linkedin_posts') return;

    const loadExistingImages = async () => {
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
            setGeneratedImages(prev => ({
              ...prev,
              [variationKey]: images.map(img => img.image_data)
            }));
            setImageCounts(prev => ({
              ...prev,
              [variationKey]: images.length
            }));
          }
        }
      } catch (error) {
        console.error('Error loading existing images:', error);
      }
    };

    loadExistingImages();
  }, [selectedItem, type]);

  // Set up real-time subscription for image updates in history
  useEffect(() => {
    if (!selectedItem || type !== 'linkedin_posts') return;

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
            
            setGeneratedImages(prev => ({
              ...prev,
              [variationKey]: [...(prev[variationKey] || []), payload.payload.image_data]
            }));

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
  }, [selectedItem, type, toast]);

  const fetchHistory = async () => {
    if (!user || !userProfile) return;
    setIsLoading(true);
    try {
      let data, error;
      
      if (type === 'job_analyses') {
        const result = await supabase
          .from('job_analyses')
          .select('id, company_name, job_title, job_description, created_at, job_match, match_score')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      } else if (type === 'cover_letters') {
        const result = await supabase
          .from('job_cover_letters')
          .select('id, company_name, job_title, job_description, created_at, cover_letter')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('job_linkedin')
          .select('id, topic, opinion, personal_story, audience, tone, created_at, post_heading_1, post_content_1, post_heading_2, post_content_2, post_heading_3, post_content_3')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      }

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

  const handleCopyResult = async (item: HistoryItem, postNumber?: number) => {
    let result;
    
    if (type === 'linkedin_posts' && postNumber) {
      // For LinkedIn posts, copy specific post content
      result = item[`post_content_${postNumber}` as keyof HistoryItem] as string;
    } else {
      result = getResult(item);
    }
    
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      const itemType = type === 'job_analyses' ? 'Job analysis' : 
                      type === 'cover_letters' ? 'Cover letter' : 
                      `LinkedIn post ${postNumber || ''}`;
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

  const handleGetImageForPost = async (item: HistoryItem, postNumber: number) => {
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

    const heading = item[`post_heading_${postNumber}` as keyof HistoryItem] as string;
    const content = item[`post_content_${postNumber}` as keyof HistoryItem] as string;
    
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
      console.log(`Attempting to delete ${type} item with ID: ${itemId} for user profile: ${userProfile.id}`);
      let tableName;
      let query;
      
      if (type === 'job_analyses') {
        tableName = 'job_analyses';
        query = supabase.from('job_analyses').delete().eq('id', itemId).eq('user_id', userProfile.id);
      } else if (type === 'cover_letters') {
        tableName = 'job_cover_letters';
        query = supabase.from('job_cover_letters').delete().eq('id', itemId).eq('user_id', userProfile.id);
      } else {
        tableName = 'job_linkedin';
        query = supabase.from('job_linkedin').delete().eq('id', itemId).eq('user_id', userProfile.id);
      }
      
      console.log(`Deleting from table: ${tableName}, item ID: ${itemId}, user_id: ${userProfile.id}`);
      const { error, data } = await query;
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      console.log('Delete operation completed successfully');

      // Remove from local state
      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      let itemType: string;
      if (type === 'job_analyses') {
        itemType = 'Job analysis';
      } else if (type === 'cover_letters') {
        itemType = 'Cover letter';
      } else {
        itemType = 'LinkedIn post';
      }
      toast({
        title: "Deleted",
        description: `${itemType} deleted successfully.`
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

  const getResult = (item: HistoryItem) => {
    if (type === 'job_analyses') {
      return item.job_match;
    } else if (type === 'cover_letters') {
      return item.cover_letter;
    } else {
      // For LinkedIn posts, we'll handle this differently in the detail view
      return null;
    }
  };

  const hasResult = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return item.post_content_1 && item.post_content_2 && item.post_content_3;
    }
    const result = getResult(item);
    return result && result.trim().length > 0;
  };

  const getItemTitle = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return item.topic || 'LinkedIn Post';
    }
    return item.company_name || 'Unknown Company';
  };

  const getItemSubtitle = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return item.tone || 'No tone specified';
    }
    return item.job_title || 'Unknown Position';
  };

  const getHistoryTitle = () => {
    if (type === 'job_analyses') {
      return 'Job Analysis History';
    } else if (type === 'cover_letters') {
      return 'Cover Letter History';
    } else {
      return 'LinkedIn Posts History';
    }
  };

  const getHistoryDescription = () => {
    if (type === 'job_analyses') {
      return 'job analyses';
    } else if (type === 'cover_letters') {
      return 'cover letters';
    } else {
      return 'LinkedIn posts';
    }
  };

  const getDetailTitle = () => {
    if (type === 'job_analyses') {
      return 'Job Analysis Details';
    } else if (type === 'cover_letters') {
      return 'Cover Letter Details';
    } else {
      return 'LinkedIn Post Details';
    }
  };

  const getResultTitle = () => {
    if (type === 'job_analyses') {
      return 'Job Analysis Result';
    } else if (type === 'cover_letters') {
      return 'Cover Letter';
    } else {
      return 'LinkedIn Post';
    }
  };

  if (showDetails && selectedItem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden bg-black border-white/20 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              {type === 'linkedin_posts' ? <Share2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              {getDetailTitle()}
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
                <Building className="w-4 h-4" />
                Input Details
              </h3>
              <div className="space-y-3">
                {type === 'linkedin_posts' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-cyan-200 text-sm font-semibold">Company Name:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                        <p className="text-white text-sm">{selectedItem.company_name}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-cyan-200 text-sm font-semibold">Job Title:</label>
                      <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
                        <p className="text-white text-sm">{selectedItem.job_title}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-cyan-200 text-sm font-semibold">Job Description:</label>
                      <div className="rounded p-3 mt-1 max-h-32 overflow-y-auto bg-black/80 border border-cyan-300/20">
                        <p className="text-white text-sm">{selectedItem.job_description}</p>
                      </div>
                    </div>
                  </>
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
                    {type === 'linkedin_posts' ? <Share2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    {getResultTitle()}
                  </div>
                </h3>

                {type === 'linkedin_posts' ? (
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

                        {/* Failed generation indicator */}
                        {imageGenerationFailed[`${selectedItem.id}-2`] && (
                          <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                            <div className="text-sm text-red-600 font-medium">Image generation failed</div>
                            <div className="text-xs text-red-500 mt-1">Please try again</div>
                          </div>
                        )}

                        {/* Generated Images */}
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

                        {/* Failed generation indicator */}
                        {imageGenerationFailed[`${selectedItem.id}-3`] && (
                          <div className="mb-4 p-3 bg-red-50 rounded-lg text-center border border-red-200">
                            <div className="text-sm text-red-600 font-medium">Image generation failed</div>
                            <div className="text-xs text-red-500 mt-1">Please try again</div>
                          </div>
                        )}

                        {/* Generated Images */}
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
                ) : (
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lime-400 font-semibold">{getResultTitle()}</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopyResult(selectedItem)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Result
                        </Button>
                        {type === 'cover_letters' && selectedItem.cover_letter && (
                          <CoverLetterDownloadActions 
                            coverLetter={selectedItem.cover_letter}
                            companyName={selectedItem.company_name || 'Company'}
                            jobTitle={selectedItem.job_title || 'Position'}
                          />
                        )}
                      </div>
                    </div>
                    
                    {type === 'job_analyses' && selectedItem.match_score && (
                      <div className="mb-4">
                        <PercentageMeter 
                          percentage={selectedItem.match_score} 
                        />
                      </div>
                    )}
                    
                    <div className="text-black bg-white rounded p-4 font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {getResult(selectedItem)}
                    </div>
                  </div>
                )}
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
            {type === 'linkedin_posts' ? <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <History className="w-4 h-4 sm:w-5 sm:h-5" />}
            {getHistoryTitle()}
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
                {type === 'linkedin_posts' ? <Share2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" /> : <History className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />}
                <p className="text-sm">No {getHistoryDescription()} found.</p>
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
                          {type === 'linkedin_posts' ? <Share2 className="w-3 h-3 flex-shrink-0" /> : <Building className="w-3 h-3 flex-shrink-0" />}
                          <span className="truncate">{getItemTitle(item)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                          {type === 'linkedin_posts' ? <FileText className="w-3 h-3 flex-shrink-0" /> : <Briefcase className="w-3 h-3 flex-shrink-0" />}
                          <span className="truncate">{getItemSubtitle(item)}</span>
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
                          {type === 'linkedin_posts' ? <Share2 className="w-4 h-4 flex-shrink-0" /> : <Building className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{getItemTitle(item)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          {type === 'linkedin_posts' ? <FileText className="w-4 h-4 flex-shrink-0" /> : <Briefcase className="w-4 h-4 flex-shrink-0" />}
                          <span className="truncate">{getItemSubtitle(item)}</span>
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

export default HistoryModal;
