
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, Calendar, Building, Briefcase, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

interface HistoryModalProps {
  type: 'job_analyses' | 'cover_letters' | 'linkedin_posts';
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
}

interface JobAnalysis {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  job_match: string | null;
  match_score: string | null;
  created_at: string;
}

interface CoverLetter {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter: string | null;
  created_at: string;
}

interface LinkedInPost {
  id: string;
  topic: string;
  opinion: string | null;
  personal_story: string | null;
  audience: string | null;
  tone: string | null;
  linkedin_post: string | null;
  created_at: string;
}

const HistoryModal = ({ type, isOpen, onClose, gradientColors }: HistoryModalProps) => {
  const [data, setData] = useState<(JobAnalysis | CoverLetter | LinkedInPost)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { userProfile } = useUserProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userProfile) {
      fetchHistory();
    }
  }, [isOpen, userProfile, type]);

  const fetchHistory = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      let tableName: string;
      let selectFields: string;

      switch (type) {
        case 'job_analyses':
          tableName = 'job_analyses';
          selectFields = 'id, company_name, job_title, job_description, job_match, match_score, created_at';
          break;
        case 'cover_letters':
          tableName = 'job_cover_letters';
          selectFields = 'id, company_name, job_title, job_description, cover_letter, created_at';
          break;
        case 'linkedin_posts':
          tableName = 'job_linkedin';
          selectFields = 'id, topic, opinion, personal_story, audience, tone, linkedin_post, created_at';
          break;
        default:
          throw new Error('Invalid type');
      }

      const { data: historyData, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setData(historyData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      let tableName: string;
      switch (type) {
        case 'job_analyses':
          tableName = 'job_analyses';
          break;
        case 'cover_letters':
          tableName = 'job_cover_letters';
          break;
        case 'linkedin_posts':
          tableName = 'job_linkedin';
          break;
        default:
          throw new Error('Invalid type');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Item deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard successfully."
      });
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast({
        title: "Error",
        description: "Failed to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
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

  const getIcon = () => {
    switch (type) {
      case 'job_analyses':
        return <Briefcase className="w-5 h-5" />;
      case 'cover_letters':
        return <Building className="w-5 h-5" />;
      case 'linkedin_posts':
        return <Share2 className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const renderJobAnalysis = (item: JobAnalysis) => (
    <Card key={item.id} className="bg-white/5 border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" />
              {item.company_name}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {item.job_title}
            </CardDescription>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.created_at).toLocaleDateString()}
              </span>
              {item.match_score && (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Score: {item.match_score}%
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {item.job_match && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleCopy(item.job_match!)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {item.job_match && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              onClick={() => toggleExpanded(item.id)}
            >
              {expandedItems.has(item.id) ? 'Hide Analysis' : 'Show Analysis'}
            </Button>
            {expandedItems.has(item.id) && (
              <div className="bg-white/5 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {item.job_match}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const renderCoverLetter = (item: CoverLetter) => (
    <Card key={item.id} className="bg-white/5 border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Building className="w-4 h-4 text-pink-400" />
              {item.company_name}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {item.job_title}
            </CardDescription>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar className="w-3 h-3" />
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            {item.cover_letter && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleCopy(item.cover_letter!)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {item.cover_letter && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-pink-400 hover:text-pink-300 p-0 h-auto"
              onClick={() => toggleExpanded(item.id)}
            >
              {expandedItems.has(item.id) ? 'Hide Cover Letter' : 'Show Cover Letter'}
            </Button>
            {expandedItems.has(item.id) && (
              <div className="bg-white/5 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {item.cover_letter}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const renderLinkedInPost = (item: LinkedInPost) => (
    <Card key={item.id} className="bg-white/5 border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              {item.topic}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.created_at).toLocaleDateString()}
              </span>
              {item.tone && (
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {item.tone}
                </Badge>
              )}
            </div>
            {item.audience && (
              <CardDescription className="text-gray-300 text-sm">
                Target: {item.audience}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {item.linkedin_post && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleCopy(item.linkedin_post!)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {item.linkedin_post && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              onClick={() => toggleExpanded(item.id)}
            >
              {expandedItems.has(item.id) ? 'Hide Post' : 'Show Post'}
            </Button>
            {expandedItems.has(item.id) && (
              <div className="bg-white/5 rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {item.linkedin_post}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  const renderItem = (item: JobAnalysis | CoverLetter | LinkedInPost) => {
    switch (type) {
      case 'job_analyses':
        return renderJobAnalysis(item as JobAnalysis);
      case 'cover_letters':
        return renderCoverLetter(item as CoverLetter);
      case 'linkedin_posts':
        return renderLinkedInPost(item as LinkedInPost);
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-gray-800/95 to-gray-900/95 border-white/20 text-white">
        <DialogHeader className="pb-6">
          <DialogTitle className={`text-2xl bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent flex items-center gap-2`}>
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No history found. Create your first {type.replace('_', ' ')} to get started!</p>
            </div>
          ) : (
            data.map(renderItem)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;
