
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import HistoryModal from './HistoryModal';

interface JobAnalysisHistoryProps {
  type: 'job_analyses' | 'cover_letters';
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
        variant="outline" 
        size="sm" 
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <History className="w-4 h-4 mr-2" />
            History
          </>
        )}
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
