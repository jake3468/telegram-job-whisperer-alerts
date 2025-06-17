
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Calendar, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import LinkedInPostDisplay from '@/components/LinkedInPostDisplay';

interface HistoryModalProps {
  type: 'job_analyses' | 'cover_letters' | 'linkedin_posts';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

interface HistoryItem {
  id: string;
  created_at: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  job_match?: string;
  match_score?: string;
  cover_letter?: string;
  topic?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
}

interface LinkedInImage {
  id: string;
  image_data: string;
  variation_number: number;
  created_at: string;
}

const HistoryModal = ({ type, isOpen, onClose, gradientColors }: HistoryModalProps) => {
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [linkedinImages, setLinkedinImages] = useState<{[postId: string]: LinkedInImage[]}>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState<{[key: string]: boolean}>({});
  const [imageGenerationCounts, setImageGenerationCounts] = useState<{[key: string]: number}>({});

  const fetchHistory = async () => {
    if (!userProfile?.id) return;

    setIsLoading(true);
    try {
      let query;
      
      if (type === 'job_analyses') {
        query = supabase
          .from('job_analyses')
          .select('id, created_at, company_name, job_title, job_description, job_match, match_score')
          .eq('user_id', userProfile.id);
      } else if (type === 'cover_letters') {
        query = supabase
          .from('job_cover_letters')
          .select('id, created_at, company_name, job_title, job_description, cover_letter')
          .eq('user_id', userProfile.id);
      } else if (type === 'linkedin_posts') {
        query = supabase
          .from('job_linkedin')
          .select('id, created_at, topic, opinion, personal_story, audience, tone, post_heading_1, post_content_1, post_heading_2, post_content_2, post_heading_3, post_content_3')
          .eq('user_id', userProfile.id);
      } else {
        return;
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching history:', error);
        toast({
          title: "Error",
          description: "Failed to load history",
          variant: "destructive"
        });
        return;
      }

      setHistoryItems(data || []);

      // If LinkedIn posts, fetch images for each post
      if (type === 'linkedin_posts' && data) {
        const imagePromises = data.map(async (post) => {
          const { data: images, error: imageError } = await supabase
            .from('linkedin_post_images')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          if (!imageError && images) {
            return { postId: post.id, images };
          }
          return { postId: post.id, images: [] };
        });

        const imageResults = await Promise.all(imagePromises);
        const imageMap: {[postId: string]: LinkedInImage[]} = {};
        const countMap: {[key: string]: number} = {};

        imageResults.forEach(({ postId, images }) => {
          imageMap[postId] = images;
          // Count images per variation
          [1, 2, 3].forEach(variation => {
            const variationImages = images.filter(img => img.variation_number === variation);
            countMap[`${postId}-${variation}`] = variationImages.length;
          });
        });

        setLinkedinImages(imageMap);
        setImageGenerationCounts(countMap);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for LinkedIn images
  useEffect(() => {
    if (type !== 'linkedin_posts' || !isOpen) return;

    console.log('Setting up LinkedIn image history subscription');

    const channel = supabase
      .channel('linkedin-image-history')
      .on(
        'broadcast',
        {
          event: 'linkedin_image_generated'
        },
        (payload) => {
          console.log('Received image broadcast in history:', payload);
          
          if (payload.payload?.post_id && payload.payload?.image_data) {
            const { post_id, variation_number, image_data } = payload.payload;
            
            // Update images
            setLinkedinImages(prev => ({
              ...prev,
              [post_id]: [
                ...(prev[post_id] || []),
                {
                  id: `temp-${Date.now()}`,
                  image_data,
                  variation_number,
                  created_at: new Date().toISOString()
                }
              ]
            }));

            // Update generation counts
            const countKey = `${post_id}-${variation_number}`;
            setImageGenerationCounts(prev => ({
              ...prev,
              [countKey]: (prev[countKey] || 0) + 1
            }));

            // Clear generating state
            setIsGeneratingImage(prev => ({
              ...prev,
              [countKey]: false
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('LinkedIn image history subscription status:', status);
      });

    return () => {
      console.log('Cleaning up LinkedIn image history subscription');
      supabase.removeChannel(channel);
    };
  }, [type, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, userProfile?.id, type]);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard successfully.`
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

  const handleGenerateImage = async (postId: string, variationNumber: number, heading: string, content: string) => {
    const countKey = `${postId}-${variationNumber}`;
    const currentCount = imageGenerationCounts[countKey] || 0;

    if (currentCount >= 3) {
      toast({
        title: "Generation Limit Reached",
        description: "You can only generate up to 3 images per post variation.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(prev => ({ ...prev, [countKey]: true }));

    // Set timeout for 2 minutes
    const timeout = setTimeout(() => {
      setIsGeneratingImage(prev => ({ ...prev, [countKey]: false }));
      toast({
        title: "Image Generation Failed",
        description: "Image generation timed out. Please try again.",
        variant: "destructive"
      });
    }, 2 * 60 * 1000);

    try {
      const { data, error } = await supabase.functions.invoke('linkedin-image-webhook', {
        body: {
          post_heading: heading,
          post_content: content,
          variation_number: variationNumber,
          user_name: 'Professional User',
          post_id: postId,
          source: 'history_page'
        }
      });

      if (error) {
        clearTimeout(timeout);
        setIsGeneratingImage(prev => ({ ...prev, [countKey]: false }));
        throw new Error(error.message || 'Failed to trigger image generation');
      }

      if (!data.success) {
        clearTimeout(timeout);
        setIsGeneratingImage(prev => ({ ...prev, [countKey]: false }));
        throw new Error(data.error || 'Failed to trigger image generation');
      }

      toast({
        title: "Image Generation Started",
        description: `LinkedIn post image is being generated...`
      });

    } catch (error) {
      clearTimeout(timeout);
      setIsGeneratingImage(prev => ({ ...prev, [countKey]: false }));
      console.error('Error triggering image generation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger image generation. Please try again.",
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

  const getTitle = () => {
    switch (type) {
      case 'job_analyses':
        return 'Job Analysis History';
      case 'cover_letters':
        return 'Cover Letter History';
      case 'linkedin_posts':
        return 'LinkedIn Posts History';
      default:
        return 'History';
    }
  };

  const renderLinkedInPost = (item: HistoryItem, variationNumber: number) => {
    const heading = item[`post_heading_${variationNumber}` as keyof HistoryItem] as string;
    const content = item[`post_content_${variationNumber}` as keyof HistoryItem] as string;
    
    if (!heading || !content) return null;

    const countKey = `${item.id}-${variationNumber}`;
    const currentCount = imageGenerationCounts[countKey] || 0;
    const canGenerateMore = currentCount < 3;
    const isGenerating = isGeneratingImage[countKey] || false;
    const postImages = linkedinImages[item.id]?.filter(img => img.variation_number === variationNumber) || [];

    return (
      <div key={`${item.id}-${variationNumber}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-teal-600">Post {variationNumber}: {heading}</h4>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCopyText(content, `Post ${variationNumber}`)}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>
            <Button
              onClick={() => handleGenerateImage(item.id, variationNumber, heading, content)}
              disabled={isGenerating || !canGenerateMore}
              size="sm"
              variant="outline"
              className="flex items-center gap-1 disabled:opacity-50"
            >
              <ImageIcon className="w-3 h-3" />
              {!canGenerateMore 
                ? 'Limit reached'
                : isGenerating 
                ? 'Generating...' 
                : `Image (${currentCount}/3)`}
            </Button>
          </div>
        </div>
        
        <LinkedInPostDisplay content={content} />

        {/* Show generated images */}
        {postImages.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-gray-700">Generated Images:</h5>
            <div className="grid gap-2">
              {postImages.map((image, index) => (
                <div key={image.id} className="relative">
                  <img 
                    src={image.image_data} 
                    alt={`Generated image ${index + 1} for ${heading}`}
                    className="w-full max-w-md rounded-lg shadow-sm"
                  />
                  <Button
                    onClick={() => handleCopyImage(image.image_data)}
                    size="sm"
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black/80 text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isGenerating && (
          <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">LinkedIn post image loading...</div>
            <div className="text-xs text-blue-500 mt-1">This may take up to 2 minutes</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 text-white border-gray-700">
        <DialogHeader className="pb-4 border-b border-gray-700">
          <DialogTitle className={`text-xl font-bold bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent flex items-center gap-2`}>
            <Calendar className="w-5 h-5 text-teal-400" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading history...</div>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No history found</div>
            </div>
          ) : (
            <div className="space-y-6">
              {historyItems.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(item.created_at)}
                    </div>
                    <Button
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      {expandedItem === item.id ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>

                  {/* Content based on type */}
                  {type === 'job_analyses' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-teal-400 font-medium">{item.company_name}</span>
                        <span className="text-gray-300">{item.job_title}</span>
                        {item.match_score && (
                          <span className="bg-teal-600 text-white px-2 py-1 rounded text-xs">
                            {item.match_score}% Match
                          </span>
                        )}
                      </div>
                      
                      {expandedItem === item.id && (
                        <div className="space-y-4">
                          {item.job_description && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-300">Job Description</h4>
                                <Button
                                  onClick={() => handleCopyText(item.job_description!, 'Job Description')}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-700 p-3 rounded text-sm whitespace-pre-wrap">
                                {item.job_description}
                              </div>
                            </div>
                          )}
                          
                          {item.job_match && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-300">Analysis Result</h4>
                                <Button
                                  onClick={() => handleCopyText(item.job_match!, 'Analysis Result')}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-700 p-3 rounded text-sm whitespace-pre-wrap">
                                {item.job_match}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {type === 'cover_letters' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-teal-400 font-medium">{item.company_name}</span>
                        <span className="text-gray-300">{item.job_title}</span>
                      </div>
                      
                      {expandedItem === item.id && (
                        <div className="space-y-4">
                          {item.job_description && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-300">Job Description</h4>
                                <Button
                                  onClick={() => handleCopyText(item.job_description!, 'Job Description')}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-700 p-3 rounded text-sm whitespace-pre-wrap">
                                {item.job_description}
                              </div>
                            </div>
                          )}
                          
                          {item.cover_letter && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-300">Cover Letter</h4>
                                <Button
                                  onClick={() => handleCopyText(item.cover_letter!, 'Cover Letter')}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </Button>
                              </div>
                              <div className="bg-gray-700 p-3 rounded text-sm whitespace-pre-wrap">
                                {item.cover_letter}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {type === 'linkedin_posts' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-teal-400 font-medium">Topic: {item.topic}</span>
                        {item.tone && <span className="text-gray-300">Tone: {item.tone}</span>}
                      </div>
                      
                      {expandedItem === item.id && (
                        <div className="space-y-6">
                          {/* Input details */}
                          <div className="bg-gray-700 p-3 rounded space-y-2">
                            <h4 className="font-semibold text-gray-300">Post Details</h4>
                            <div className="text-sm space-y-1">
                              {item.opinion && <div><span className="text-teal-400">Opinion:</span> {item.opinion}</div>}
                              {item.personal_story && <div><span className="text-teal-400">Story:</span> {item.personal_story}</div>}
                              {item.audience && <div><span className="text-teal-400">Audience:</span> {item.audience}</div>}
                            </div>
                          </div>
                          
                          {/* Post variations */}
                          <div className="space-y-4">
                            {[1, 2, 3].map(num => renderLinkedInPost(item, num)).filter(Boolean)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;
