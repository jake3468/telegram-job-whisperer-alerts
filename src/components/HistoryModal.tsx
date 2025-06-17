import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import LinkedInPostDisplay from './LinkedInPostDisplay';
import { jsPDF } from 'jspdf';

interface HistoryItem {
  id: string;
  created_at: string;
  topic?: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  cover_letter?: string;
  job_match?: string;
  match_score?: string;
  post_heading_1?: string;
  post_content_1?: string;
  post_heading_2?: string;
  post_content_2?: string;
  post_heading_3?: string;
  post_content_3?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
}

interface LinkedInPostImage {
  id: string;
  post_id: string;
  variation_number: number;
  image_data: string;
  created_at: string;
}

interface HistoryModalProps {
  type: 'job_analysis' | 'cover_letters' | 'linkedin_posts';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

const HistoryModal = ({ type, isOpen, onClose, gradientColors }: HistoryModalProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [linkedInImages, setLinkedInImages] = useState<{ [postId: string]: LinkedInPostImage[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<HistoryItem | null>(null);

  // Get table name based on type
  const getTableName = () => {
    switch (type) {
      case 'job_analysis':
        return 'job_analyses';
      case 'cover_letters':
        return 'job_cover_letters';
      case 'linkedin_posts':
        return 'job_linkedin';
      default:
        return 'job_analyses';
    }
  };

  // Get user profile ID
  const getUserProfileId = async () => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', data.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }
      
      return profileData.id;
    } catch (err) {
      console.error('Error getting user profile ID:', err);
      return null;
    }
  };

  // Load LinkedIn post images
  const loadLinkedInImages = async (postIds: string[]) => {
    if (type !== 'linkedin_posts' || postIds.length === 0) return;

    try {
      const { data: images, error } = await supabase
        .from('linkedin_post_images')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading LinkedIn images:', error);
        return;
      }

      // Group images by post_id
      const imagesByPost: { [postId: string]: LinkedInPostImage[] } = {};
      images?.forEach(image => {
        if (!imagesByPost[image.post_id]) {
          imagesByPost[image.post_id] = [];
        }
        imagesByPost[image.post_id].push(image);
      });

      setLinkedInImages(imagesByPost);
    } catch (err) {
      console.error('Error loading LinkedIn images:', err);
    }
  };

  // Fetch history items
  const fetchHistory = async () => {
    setIsLoading(true);
    
    try {
      const userProfileId = await getUserProfileId();
      if (!userProfileId) {
        console.error('No user profile ID found');
        return;
      }

      const { data, error } = await supabase
        .from(getTableName())
        .select('*')
        .eq('user_id', userProfileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        toast({
          title: "Error",
          description: "Failed to load history items.",
          variant: "destructive"
        });
        return;
      }

      setHistoryItems(data || []);

      // Load LinkedIn images if this is the LinkedIn posts type
      if (type === 'linkedin_posts' && data && data.length > 0) {
        const postIds = data.map(item => item.id);
        await loadLinkedInImages(postIds);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      toast({
        title: "Error",
        description: "Failed to load history items.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for LinkedIn images
  useEffect(() => {
    if (type !== 'linkedin_posts' || !isOpen) return;

    const channel = supabase
      .channel(`linkedin-image-history`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'linkedin_post_images'
        },
        (payload) => {
          console.log('New LinkedIn image in history:', payload);
          const newImage = payload.new as LinkedInPostImage;
          
          setLinkedInImages(prev => ({
            ...prev,
            [newImage.post_id]: [
              ...(prev[newImage.post_id] || []),
              newImage
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, type]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard successfully."
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Error",
        description: "Failed to copy content.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = (item: HistoryItem) => {
    try {
      const doc = new jsPDF();
      
      if (type === 'cover_letters') {
        doc.setFontSize(16);
        doc.text('Cover Letter', 20, 20);
        doc.setFontSize(12);
        doc.text(`Company: ${item.company_name || 'N/A'}`, 20, 40);
        doc.text(`Position: ${item.job_title || 'N/A'}`, 20, 50);
        doc.text(`Generated: ${new Date(item.created_at).toLocaleDateString()}`, 20, 60);
        
        const splitText = doc.splitTextToSize(item.cover_letter || '', 170);
        doc.text(splitText, 20, 80);
      } else if (type === 'job_analysis') {
        doc.setFontSize(16);
        doc.text('Job Analysis', 20, 20);
        doc.setFontSize(12);
        doc.text(`Company: ${item.company_name || 'N/A'}`, 20, 40);
        doc.text(`Position: ${item.job_title || 'N/A'}`, 20, 50);
        doc.text(`Match Score: ${item.match_score || 'N/A'}`, 20, 60);
        doc.text(`Generated: ${new Date(item.created_at).toLocaleDateString()}`, 20, 70);
        
        const splitText = doc.splitTextToSize(item.job_match || '', 170);
        doc.text(splitText, 20, 90);
      } else if (type === 'linkedin_posts') {
        doc.setFontSize(16);
        doc.text('LinkedIn Posts', 20, 20);
        doc.setFontSize(12);
        doc.text(`Topic: ${item.topic || 'N/A'}`, 20, 40);
        doc.text(`Generated: ${new Date(item.created_at).toLocaleDateString()}`, 20, 50);
        
        let yPosition = 70;
        
        if (item.post_heading_1 && item.post_content_1) {
          doc.setFontSize(14);
          doc.text('Post 1:', 20, yPosition);
          yPosition += 10;
          doc.setFontSize(12);
          doc.text(item.post_heading_1, 20, yPosition);
          yPosition += 10;
          const splitContent1 = doc.splitTextToSize(item.post_content_1, 170);
          doc.text(splitContent1, 20, yPosition);
          yPosition += splitContent1.length * 5 + 10;
        }
        
        if (item.post_heading_2 && item.post_content_2) {
          doc.setFontSize(14);
          doc.text('Post 2:', 20, yPosition);
          yPosition += 10;
          doc.setFontSize(12);
          doc.text(item.post_heading_2, 20, yPosition);
          yPosition += 10;
          const splitContent2 = doc.splitTextToSize(item.post_content_2, 170);
          doc.text(splitContent2, 20, yPosition);
          yPosition += splitContent2.length * 5 + 10;
        }
        
        if (item.post_heading_3 && item.post_content_3) {
          doc.setFontSize(14);
          doc.text('Post 3:', 20, yPosition);
          yPosition += 10;
          doc.setFontSize(12);
          doc.text(item.post_heading_3, 20, yPosition);
          yPosition += 10;
          const splitContent3 = doc.splitTextToSize(item.post_content_3, 170);
          doc.text(splitContent3, 20, yPosition);
        }
      }
      
      doc.save(`${type.replace('_', '-')}-${new Date(item.created_at).toLocaleDateString()}.pdf`);
      
      toast({
        title: "Downloaded!",
        description: "PDF downloaded successfully."
      });
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast({
        title: "Error",
        description: "Failed to download PDF.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    try {
      const { error } = await supabase
        .from(getTableName())
        .delete()
        .eq('id', item.id);

      if (error) {
        console.error('Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete item.",
          variant: "destructive"
        });
        return;
      }

      setHistoryItems(prev => prev.filter(historyItem => historyItem.id !== item.id));
      
      toast({
        title: "Deleted!",
        description: "Item deleted successfully."
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive"
      });
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'job_analysis':
        return 'Job Analysis History';
      case 'cover_letters':
        return 'Cover Letter History';
      case 'linkedin_posts':
        return 'LinkedIn Posts History';
      default:
        return 'History';
    }
  };

  const renderLinkedInPostItem = (item: HistoryItem) => {
    const postImages = linkedInImages[item.id] || [];
    
    return (
      <Card key={item.id} className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                {item.topic || 'LinkedIn Post'}
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                  {new Date(item.created_at).toLocaleDateString()}
                </Badge>
                {item.tone && (
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                    {item.tone}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadPDF(item)}
                className="text-slate-400 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(item)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Show all 3 post variations */}
          <div className="space-y-4">
            {item.post_heading_1 && item.post_content_1 && (
              <div className="bg-slate-700 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-yellow-400 text-sm">Post 1: {item.post_heading_1}</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item.post_content_1 || '')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-slate-300 text-xs mb-2">{item.post_content_1.substring(0, 150)}...</p>
                
                {/* Images for variation 1 */}
                {postImages.filter(img => img.variation_number === 1).length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-cyan-400 text-xs font-medium">Generated Images (1):</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {postImages
                        .filter(img => img.variation_number === 1)
                        .map((image, idx) => (
                        <div key={image.id} className="relative">
                          <img 
                            src={image.image_data} 
                            alt={`Post 1 Image ${idx + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => window.open(image.image_data, '_blank')}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(image.image_data)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {item.post_heading_2 && item.post_content_2 && (
              <div className="bg-slate-700 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-yellow-400 text-sm">Post 2: {item.post_heading_2}</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item.post_content_2 || '')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-slate-300 text-xs mb-2">{item.post_content_2.substring(0, 150)}...</p>
                
                {/* Images for variation 2 */}
                {postImages.filter(img => img.variation_number === 2).length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-cyan-400 text-xs font-medium">Generated Images (2):</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {postImages
                        .filter(img => img.variation_number === 2)
                        .map((image, idx) => (
                        <div key={image.id} className="relative">
                          <img 
                            src={image.image_data} 
                            alt={`Post 2 Image ${idx + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => window.open(image.image_data, '_blank')}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(image.image_data)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {item.post_heading_3 && item.post_content_3 && (
              <div className="bg-slate-700 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-yellow-400 text-sm">Post 3: {item.post_heading_3}</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item.post_content_3 || '')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-slate-300 text-xs mb-2">{item.post_content_3.substring(0, 150)}...</p>
                
                {/* Images for variation 3 */}
                {postImages.filter(img => img.variation_number === 3).length > 0 && (
                  <div className="space-y-2">
                    <h6 className="text-cyan-400 text-xs font-medium">Generated Images (3):</h6>
                    <div className="grid grid-cols-3 gap-2">
                      {postImages
                        .filter(img => img.variation_number === 3)
                        .map((image, idx) => (
                        <div key={image.id} className="relative">
                          <img 
                            src={image.image_data} 
                            alt={`Post 3 Image ${idx + 1}`}
                            className="w-full h-20 object-cover rounded cursor-pointer"
                            onClick={() => window.open(image.image_data, '_blank')}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(image.image_data)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 h-auto"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHistoryItem = (item: HistoryItem) => {
    if (type === 'linkedin_posts') {
      return renderLinkedInPostItem(item);
    }

    
    return (
      <Card key={item.id} className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                {type === 'cover_letters' 
                  ? `${item.company_name} - ${item.job_title}`
                  : `${item.company_name} - ${item.job_title}`
                }
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                  {new Date(item.created_at).toLocaleDateString()}
                </Badge>
                {type === 'job_analysis' && item.match_score && (
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                    Match: {item.match_score}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(type === 'cover_letters' ? item.cover_letter || '' : item.job_match || '')}
                className="text-slate-400 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadPDF(item)}
                className="text-slate-400 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(item)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-slate-300 text-xs">
            {type === 'cover_letters' 
              ? (item.cover_letter?.substring(0, 150) + "...")
              : (item.job_match?.substring(0, 150) + "...")
            }
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent`}>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-400">Loading history...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No items found in your history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyItems.map(renderHistoryItem)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;
