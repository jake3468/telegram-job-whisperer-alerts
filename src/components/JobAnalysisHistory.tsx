import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import JobAnalysisHistoryModal from './JobAnalysisHistoryModal';

interface JobAnalysisHistoryProps {
  type: 'job_analysis' | 'cover_letters';
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

  const handleOpenModal = async () => {
    setIsLoading(true);
    try {
      // Preload data before opening modal
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error opening history modal:', error);
    } finally {
      // Keep loading state briefly to ensure modal has time to load
      setTimeout(() => setIsLoading(false), 500);
    }
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

      <JobAnalysisHistoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsLoading(false);
        }}
        gradientColors={gradientColors}
      />
    </>
  );
};

export default JobAnalysisHistory;
