
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, Share2, X, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import LinkedInHistoryItem from './linkedin-history/LinkedInHistoryItem';
import LinkedInInputDetails from './linkedin-history/LinkedInInputDetails';
import LinkedInPostResult from './linkedin-history/LinkedInPostResult';
import { useLinkedInImageManager } from './linkedin-history/useLinkedInImageManager';

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

  const {
    generatedImages,
    loadingImage,
    imageGenerationFailed,
    hasImages,
    handleGetImageForPost
  } = useLinkedInImageManager(selectedItem);

  useEffect(() => {
    if (isOpen && user && userProfile) {
      fetchHistory();
    }
  }, [isOpen, user, userProfile]);

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

      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Deleted",
        description: "LinkedIn post deleted successfully."
      });

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

  const hasResult = (item: LinkedInPostItem) => {
    return item.post_content_1 && item.post_content_2 && item.post_content_3;
  };

  const handleViewItem = (item: LinkedInPostItem) => {
    setSelectedItem(item);
    setShowDetails(true);
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
            <LinkedInInputDetails item={selectedItem} />

            {hasResult(selectedItem) && (
              <div className="rounded-lg p-4 border border-white/10 shadow-inner bg-red-700">
                <h3 className="text-white font-medium mb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    LinkedIn Post
                  </div>
                </h3>

                <div className="space-y-6">
                  {[1, 2, 3].map(postNumber => (
                    <LinkedInPostResult
                      key={postNumber}
                      item={selectedItem}
                      postNumber={postNumber}
                      generatedImages={generatedImages}
                      loadingImage={loadingImage}
                      imageGenerationFailed={imageGenerationFailed}
                      hasImages={hasImages}
                      onCopyResult={handleCopyResult}
                      onGetImage={handleGetImageForPost}
                      onCopyImage={handleCopyImage}
                    />
                  ))}
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
                <LinkedInHistoryItem
                  key={item.id}
                  item={item}
                  onView={handleViewItem}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInPostsHistoryModal;
