
import { FileText } from 'lucide-react';

interface LinkedInPostItem {
  id: string;
  topic?: string;
  opinion?: string;
  personal_story?: string;
  audience?: string;
  tone?: string;
  created_at: string;
}

interface LinkedInInputDetailsProps {
  item: LinkedInPostItem;
}

const LinkedInInputDetails = ({ item }: LinkedInInputDetailsProps) => {
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
    <div className="rounded-lg p-4 border border-white/10 bg-blue-800">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Input Details
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-cyan-200 text-sm font-semibold">Topic:</label>
          <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
            <p className="text-white text-sm">{item.topic}</p>
          </div>
        </div>
        {item.opinion && (
          <div>
            <label className="text-cyan-200 text-sm font-semibold">Opinion:</label>
            <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
              <p className="text-white text-sm">{item.opinion}</p>
            </div>
          </div>
        )}
        {item.personal_story && (
          <div>
            <label className="text-cyan-200 text-sm font-semibold">Personal Story:</label>
            <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
              <p className="text-white text-sm">{item.personal_story}</p>
            </div>
          </div>
        )}
        {item.audience && (
          <div>
            <label className="text-cyan-200 text-sm font-semibold">Audience:</label>
            <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
              <p className="text-white text-sm">{item.audience}</p>
            </div>
          </div>
        )}
        {item.tone && (
          <div>
            <label className="text-cyan-200 text-sm font-semibold">Tone:</label>
            <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
              <p className="text-white text-sm">{item.tone}</p>
            </div>
          </div>
        )}
        <div>
          <label className="text-cyan-200 text-sm font-semibold">Created:</label>
          <div className="rounded p-3 mt-1 bg-black/80 border border-cyan-300/20">
            <p className="text-white text-sm">{formatDate(item.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInInputDetails;
