
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, History, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

interface LinkedInPostHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LinkedInPostHistoryModal: React.FC<LinkedInPostHistoryModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useUserProfile();

  const { data: linkedInPosts, isLoading, error } = useQuery({
    queryKey: ['linkedin-posts-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('job_linkedin')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id && isOpen,
  });

  return (
    <>
      <Button 
        onClick={() => onClose()} 
        variant="outline" 
        size="sm" 
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <History className="w-4 h-4 mr-2" />
        History
      </Button>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-slate-900 to-gray-900 border-gray-700">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white">LinkedIn Posts History</DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="ml-3 text-gray-300">Loading LinkedIn posts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg">Failed to load LinkedIn posts history</p>
                <p className="text-gray-400 text-sm mt-2">Please try again later</p>
              </div>
            ) : !linkedInPosts || linkedInPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No LinkedIn posts found</p>
                <p className="text-gray-500 text-sm mt-2">Your generated posts will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {linkedInPosts.map((post) => (
                  <Card key={post.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-white font-medium">
                          Topic: {post.topic}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                        {post.post_heading_1 && (
                          <div className="text-xs">
                            <div className="text-gray-300 font-medium">{post.post_heading_1}</div>
                            <div className="text-gray-500 mt-1 line-clamp-2">
                              {post.post_content_1?.substring(0, 100)}...
                            </div>
                          </div>
                        )}
                        {post.post_heading_2 && (
                          <div className="text-xs">
                            <div className="text-gray-300 font-medium">{post.post_heading_2}</div>
                            <div className="text-gray-500 mt-1 line-clamp-2">
                              {post.post_content_2?.substring(0, 100)}...
                            </div>
                          </div>
                        )}
                        {post.post_heading_3 && (
                          <div className="text-xs">
                            <div className="text-gray-300 font-medium">{post.post_heading_3}</div>
                            <div className="text-gray-500 mt-1 line-clamp-2">
                              {post.post_content_3?.substring(0, 100)}...
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LinkedInPostHistoryModal;
