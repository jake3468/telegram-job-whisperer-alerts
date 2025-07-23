import React, { useState, useEffect } from 'react';
import { AlertCircle, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedTokenManager } from '@/hooks/useEnhancedTokenManager';

interface AuthenticationRecoveryProps {
  onRecoveryAttempt?: () => void;
  onRecoverySuccess?: () => void;
  className?: string;
}

/**
 * Professional authentication recovery component
 * Handles silent re-authentication with progressive UX
 */
export const AuthenticationRecovery: React.FC<AuthenticationRecoveryProps> = ({
  onRecoveryAttempt,
  onRecoverySuccess,
  className = ''
}) => {
  const { refreshToken, isReady } = useEnhancedTokenManager();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);

  // Auto-attempt recovery on mount
  useEffect(() => {
    attemptRecovery();
  }, []);

  const attemptRecovery = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);
    onRecoveryAttempt?.();

    try {
      const token = await refreshToken(true);
      if (token) {
        onRecoverySuccess?.();
      }
    } catch (error) {
      console.error('[AuthRecovery] Recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  // Progressive recovery messages
  const getRecoveryMessage = () => {
    if (isRecovering) {
      switch (recoveryAttempts) {
        case 1:
          return 'Reconnecting...';
        case 2:
          return 'Still trying...';
        default:
          return 'Working on it...';
      }
    }
    
    if (recoveryAttempts === 0) {
      return 'Connection issue detected';
    }
    
    return 'Connection issue. Try again?';
  };

  return (
    <div className={`flex items-center gap-2 p-3 bg-orange-900/20 border border-orange-400/30 rounded-lg ${className}`}>
      {isRecovering ? (
        <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
      ) : (
        <Wifi className="w-4 h-4 text-orange-400" />
      )}
      
      <span className="text-orange-300 text-sm flex-1">
        {getRecoveryMessage()}
      </span>
      
      {!isRecovering && recoveryAttempts > 0 && (
        <Button
          onClick={attemptRecovery}
          variant="ghost"
          size="sm"
          className="text-orange-300 hover:text-orange-200 h-6 px-2"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};