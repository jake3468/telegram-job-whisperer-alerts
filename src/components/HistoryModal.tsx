import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { History, FileText, Briefcase, Building, Calendar, Trash2, Eye, Copy, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HistoryItem {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  created_at: string;
  job_match?: string;
  match_score?: string;
  cover_letter?: string;
}

interface HistoryModalProps {
  type: 'job_guide' | 'cover_letter';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

const HistoryModal = ({ type, isOpen, onClose, gradientColors }: HistoryModalProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found in database');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('User profile not found');
      }

      const tableName = type === 'job_guide' ? 'job_analyses' : 'job_cover_letters';
      
      let query;
      if (type === 'job_guide') {
        query = supabase
          .from(tableName)
          .select('id, company_name, job_title, job_description, created_at, job_match, match_score')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(20);
      } else {
        query = supabase
          .from(tableName)
          .select('id, company_name, job_title, job_description, created_at, cover_letter')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(20);
      }
      
      const { data, error } = await query;

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

  const handleDelete = async (itemId: string) => {
    try {
      const tableName = type === 'job_guide' ? 'job_analyses' : 'job_cover_letters';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setHistoryData(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Deleted",
        description: `${type === 'job_guide' ? 'Job analysis' : 'Cover letter'} deleted successfully.`
      });
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard successfully."
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
    return type === 'job_guide' ? item.job_match : item.cover_letter;
  };

  const hasResult = (item: HistoryItem) => {
    const result = getResult(item);
    return result && result.trim().length > 0;
  };

  if (showDetails && selectedItem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              {type === 'job_guide' ? 'Job Analysis Details' : 'Cover Letter Details'}
              <Button 
                onClick={() => setShowDetails(false)} 
                size="sm" 
                className="ml-auto bg-white/20 hover:bg-white/30 text-white border-white/20 text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Input Details Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Input Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-sm">Company Name:</label>
                  <p className="text-white">{selectedItem.company_name}</p>
                </div>
                <div>
                  <label className="text-white/70 text-sm">Job Title:</label>
                  <p className="text-white">{selectedItem.job_title}</p>
                </div>
                <div>
                  <label className="text-white/70 text-sm">Job Description:</label>
                  <div className="bg-white/5 rounded p-3 max-h-32 overflow-y-auto">
                    <p className="text-white text-sm">{selectedItem.job_description}</p>
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-sm">Created:</label>
                  <p className="text-white">{formatDate(selectedItem.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Result Section */}
            {hasResult(selectedItem) && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {type === 'job_guide' ? 'Job Analysis Result' : 'Cover Letter'}
                  </span>
                  {type === 'cover_letter' && (
                    <Button
                      onClick={() => handleCopy(getResult(selectedItem) || '')}
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  )}
                </h3>
                <div 
                  className={`p-4 rounded-lg border-2 max-h-96 overflow-y-auto ${
                    type === 'cover_letter' 
                      ? 'bg-white notebook-paper border-blue-200' 
                      : 'bg-gray-50 notebook-paper border-gray-300'
                  }`}
                  style={{
                    backgroundImage: type === 'cover_letter' || type === 'job_guide' 
                      ? `linear-gradient(to right, #ff69b4 1px, transparent 1px),
                         linear-gradient(to bottom, transparent 24px, #e0e0e0 24px, #e0e0e0 26px, transparent 26px)`
                      : 'none',
                    backgroundSize: type === 'cover_letter' || type === 'job_guide' ? '30px 26px' : 'auto',
                    paddingLeft: type === 'cover_letter' || type === 'job_guide' ? '40px' : '16px'
                  }}
                >
                  <div 
                    className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: 'serif' }}
                  >
                    {getResult(selectedItem)}
                  </div>
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white font-inter flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            {type === 'job_guide' ? 'Job Analysis History' : 'Cover Letter History'}
          </DialogTitle>
          <DialogDescription className="text-white/70 font-inter text-sm">
            Your history is automatically deleted after 60 days. Found {historyData.length} items.
          </DialogDescription>
        </DialogHeader>
        
        {/* 60-day retention notice */}
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-orange-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">
              Your history is automatically deleted after 60 days for privacy and storage optimization.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/70">Loading history...</div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/70 text-center">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No {type === 'job_guide' ? 'job analyses' : 'cover letters'} found.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {historyData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Main content - single line on desktop, stacked on mobile */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 text-white font-medium truncate">
                          <Building className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.company_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 truncate">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.job_title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
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
                      
                      {type === 'cover_letter' && hasResult(item) && (
                        <Button
                          onClick={() => handleCopy(getResult(item) || '')}
                          size="sm"
                          className="bg-green-600/80 hover:bg-green-600 text-white text-xs px-3 py-1"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      )}
                      
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
