
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Share2, FileText, Calendar } from 'lucide-react';

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

interface LinkedInHistoryItemProps {
  item: LinkedInPostItem;
  onView: (item: LinkedInPostItem) => void;
  onDelete: (itemId: string) => void;
}

const LinkedInHistoryItem = ({ item, onView, onDelete }: LinkedInHistoryItemProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-lg p-3 sm:p-4 border border-white/10 transition-colors bg-indigo-800">
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Share2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.topic || 'LinkedIn Post'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.tone || 'No tone specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 pt-2">
          <Button 
            onClick={() => onView(item)} 
            size="sm" 
            className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-2 py-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          
          <Button 
            onClick={() => onDelete(item.id)} 
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
              <Share2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.topic || 'LinkedIn Post'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 truncate">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.tone || 'No tone specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            onClick={() => onView(item)} 
            size="sm" 
            className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs px-3 py-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          
          <Button 
            onClick={() => onDelete(item.id)} 
            size="sm" 
            className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LinkedInHistoryItem;
