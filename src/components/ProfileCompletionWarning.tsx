
import { AlertCircle } from 'lucide-react';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useState, useEffect } from 'react';

interface ProfileCompletionWarningProps {
  className?: string;
}

export const ProfileCompletionWarning = ({ className = '' }: ProfileCompletionWarningProps) => {
  const { hasResume, hasBio, loading } = useCachedUserCompletionStatus();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Only show warning after loading is complete and profile is actually incomplete
    // Add extra delay to ensure all authentication is settled
    if (!loading) {
      const timer = setTimeout(() => {
        const isIncomplete = !hasResume || !hasBio;
        setShowWarning(isIncomplete);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, hasResume, hasBio]);

  // Don't show anything while loading or if profile is complete
  if (loading || !showWarning) {
    return null;
  }

  const missingItems = [];
  if (!hasResume) missingItems.push('resume');
  if (!hasBio) missingItems.push('bio');

  return (
    <div className={`flex items-start gap-3 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg mb-6 ${className}`}>
      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
      <div className="text-yellow-100">
        <p className="font-medium mb-1">Complete your profile for better results</p>
        <p className="text-sm text-yellow-200">
          Please add your {missingItems.join(' and ')} in your{' '}
          <a href="/profile" className="underline hover:text-yellow-100 transition-colors">
            profile page
          </a>{' '}
          to get more personalized recommendations.
        </p>
      </div>
    </div>
  );
};
