
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, User } from 'lucide-react';

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

interface LinkedInPostDisplayProps {
  content: string;
  userProfile?: UserProfile | null;
  userData?: UserData | null;
}

const LinkedInPostDisplay = ({ content, userProfile, userData }: LinkedInPostDisplayProps) => {
  // Get user's actual name from userData
  const getDisplayName = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    } else if (userData?.first_name) {
      return userData.first_name;
    } else if (userData?.last_name) {
      return userData.last_name;
    }
    return 'Professional User';
  };

  const userName = getDisplayName();

  return (
    <Card className="bg-white border border-slate-200 shadow-sm max-w-2xl mx-auto mt-4">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{userName}</h3>
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
  );
};

export default LinkedInPostDisplay;
