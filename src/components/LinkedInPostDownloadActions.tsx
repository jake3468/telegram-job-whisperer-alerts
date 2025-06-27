
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface LinkedInPostsData {
  id: string;
  user_id: string;
  post_heading_1: string | null;
  post_content_1: string | null;
  post_heading_2: string | null;
  post_content_2: string | null;
  post_heading_3: string | null;
  post_content_3: string | null;
  created_at: string;
  updated_at: string;
}

interface LinkedInPostDownloadActionsProps {
  linkedInPosts: LinkedInPostsData;
  topic: string;
}

const LinkedInPostDownloadActions: React.FC<LinkedInPostDownloadActionsProps> = ({ 
  linkedInPosts, 
  topic 
}) => {
  const handleDownloadTxt = () => {
    let content = `LinkedIn Posts for Topic: ${topic}\n`;
    content += `Generated on: ${new Date(linkedInPosts.created_at).toLocaleDateString()}\n\n`;
    content += '=' .repeat(50) + '\n\n';

    if (linkedInPosts.post_heading_1 && linkedInPosts.post_content_1) {
      content += `POST 1: ${linkedInPosts.post_heading_1}\n`;
      content += '-'.repeat(30) + '\n';
      content += `${linkedInPosts.post_content_1}\n\n`;
    }

    if (linkedInPosts.post_heading_2 && linkedInPosts.post_content_2) {
      content += `POST 2: ${linkedInPosts.post_heading_2}\n`;
      content += '-'.repeat(30) + '\n';
      content += `${linkedInPosts.post_content_2}\n\n`;
    }

    if (linkedInPosts.post_heading_3 && linkedInPosts.post_content_3) {
      content += `POST 3: ${linkedInPosts.post_heading_3}\n`;
      content += '-'.repeat(30) + '\n';
      content += `${linkedInPosts.post_content_3}\n\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-posts-${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-center mt-8">
      <Button onClick={handleDownloadTxt} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <Download className="w-4 h-4 mr-2" />
        Download as Text
      </Button>
    </div>
  );
};

export default LinkedInPostDownloadActions;
