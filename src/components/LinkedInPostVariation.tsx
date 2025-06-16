
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, User, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  created_at: string | null;
}

interface LinkedInPostVariationProps {
  heading: string;
  content: string;
  userProfile?: UserProfile | null;
  variationNumber: number;
}

const LinkedInPostVariation = ({ heading, content, userProfile, variationNumber }: LinkedInPostVariationProps) => {
  const { toast } = useToast();
  const userName = userProfile ? 'Professional User' : 'Professional User';

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

  const handleGetImage = () => {
    toast({
      title: "Coming Soon!",
      description: "Image generation feature will be available soon."
    });
  };

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-cyan-300 mb-2">{heading}</h3>
      </div>

      {/* LinkedIn Post Preview */}
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{userName}</h4>
                <p className="text-xs text-slate-500">Professional • 1st</p>
                <p className="text-xs text-slate-500">2m • 🌐</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
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
              <span>12 reactions</span>
            </div>
            <div className="text-xs text-slate-500">
              3 comments • 1 repost
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 flex-1">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 flex-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 flex-1">
              <Repeat2 className="w-4 h-4" />
              <span className="text-sm font-medium">Repost</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 flex-1">
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleCopyContent} 
          className="flex-1 bg-teal-700 hover:bg-teal-600 text-white flex items-center gap-2 text-sm h-10 font-semibold"
        >
          <Copy className="w-4 h-4" />
          Copy Post {variationNumber}
        </Button>
        
        <Button 
          onClick={handleGetImage}
          variant="outline" 
          className="flex-1 border-teal-400/25 text-teal-300 hover:bg-teal-400/10 text-sm h-10"
        >
          Get Image for Post
        </Button>
      </div>
    </div>
  );
};

export default LinkedInPostVariation;
