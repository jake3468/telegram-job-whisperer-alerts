
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal } from 'lucide-react';

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
  const userName = userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 'Professional User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'PU';

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{userName}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.bio?.substring(0, 60) || "Professional"}{userProfile?.bio && userProfile.bio.length > 60 ? '...' : ''}
                </p>
                <p className="text-xs text-gray-400">2h</p>
              </div>
              <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Heart className="w-2 h-2 text-white fill-current" />
              </div>
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">👏</span>
              </div>
            </div>
            <span>12 reactions</span>
          </div>
          <div className="flex items-center gap-3">
            <span>3 comments</span>
            <span>1 repost</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed positioning */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 flex-1 justify-center max-w-none">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 flex-1 justify-center max-w-none">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 flex-1 justify-center max-w-none">
            <Repeat2 className="w-4 h-4" />
            <span className="text-sm">Repost</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:bg-gray-50 flex-1 justify-center max-w-none">
            <Send className="w-4 h-4" />
            <span className="text-sm">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostDisplay;
