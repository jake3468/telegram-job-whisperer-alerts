
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import HistoryModal from './HistoryModal';

interface JobAnalysisHistoryProps {
  type: 'job_guide' | 'cover_letter';
  gradientColors: string;
  borderColors: string;
}

const JobAnalysisHistory = ({
  type,
  gradientColors,
  borderColors
}: JobAnalysisHistoryProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = () => {
    setIsLoading(true);
    setIsModalOpen(true);
    // Small delay to show loading state
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <>
      <Button 
        onClick={handleOpenModal} 
        disabled={isLoading} 
        className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20 text-xs px-4 py-2"
      >
        <div className="flex items-center justify-center gap-2 w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
              <span className="text-center text-xs">Loading...</span>
            </>
          ) : (
            <>
              <History className="w-3 h-3 flex-shrink-0" />
              <span className="text-center text-xs">
                View {type === 'job_guide' ? 'Job Analysis' : 'Cover Letter'} History
              </span>
            </>
          )}
        </div>
      </Button>

      <HistoryModal
        type={type}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gradientColors={gradientColors}
      />
    </>
  );
};

export default JobAnalysisHistory;
