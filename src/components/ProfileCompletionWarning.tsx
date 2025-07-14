
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileCompletionWarningProps {
  className?: string;
}

export const ProfileCompletionWarning = ({ className = '' }: ProfileCompletionWarningProps) => {
  const { hasResume, hasBio, loading, lastChecked, refetchStatus } = useCachedUserCompletionStatus();
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Add debugging
    console.log('ProfileCompletionWarning - Status check:', {
      loading,
      hasResume,
      hasBio,
      lastChecked,
      showWarning
    });

    // Only show warning after loading is complete and profile is actually incomplete
    // Add extra delay to ensure all authentication is settled
    if (!loading) {
      const timer = setTimeout(() => {
        const isIncomplete = !hasResume || !hasBio;
        setShowWarning(isIncomplete);
        
        // Additional debugging
        if (isIncomplete) {
          console.log('Profile incomplete - Missing:', {
            resume: !hasResume,
            bio: !hasBio
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, hasResume, hasBio, lastChecked]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('Manual refresh triggered for profile completion status');
    
    try {
      await refetchStatus();
      console.log('Profile refresh completed');
    } catch (error) {
      console.error('Error refreshing profile status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
      <div className="flex-1 text-yellow-100">
        <p className="font-medium mb-1">Complete your profile for better results</p>
        <p className="text-sm text-yellow-200">
          Please add your {missingItems.join(' and ')} in your{' '}
          <a href="/profile" className="underline hover:text-yellow-100 transition-colors">
            profile page
          </a>{' '}
          to get more personalized recommendations.
        </p>
        {lastChecked && (
          <p className="text-xs text-yellow-300 mt-1">
            Last checked: {new Date(lastChecked).toLocaleTimeString()}
          </p>
        )}
      </div>
      <Button 
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant="ghost"
        size="sm"
        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30 h-8 w-8 p-0 flex-shrink-0"
        title="Refresh profile status"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
