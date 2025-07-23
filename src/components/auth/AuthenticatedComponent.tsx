import React, { useState, useRef, useCallback } from 'react';
import { useEnhancedTokenManager } from '@/hooks/useEnhancedTokenManager';
import { AuthenticationRecovery } from './AuthenticationRecovery';
import { analyzeAuthError, AuthError } from '@/utils/authErrorHandler';

interface AuthenticatedComponentProps {
  children: React.ReactNode;
  onAuthError?: (error: AuthError) => void;
  className?: string;
}

/**
 * Smart wrapper component that provides authentication context and recovery
 * Handles component-level authentication state with smooth UX
 */
export const AuthenticatedComponent: React.FC<AuthenticatedComponentProps> = ({
  children,
  onAuthError,
  className = ''
}) => {
  const { refreshToken, isReady, isTokenValid } = useEnhancedTokenManager();
  const [authState, setAuthState] = useState<'ready' | 'recovering' | 'error'>('ready');
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const recoveryAttempts = useRef(0);

  // Handle authentication errors with progressive recovery
  const handleAuthError = useCallback((error: any) => {
    const authError = analyzeAuthError(error, recoveryAttempts.current);
    setLastError(authError);
    onAuthError?.(authError);

    if (authError.isAuthError) {
      setAuthState('recovering');
      
      if (authError.shouldRetry) {
        recoveryAttempts.current += 1;
        setTimeout(async () => {
          try {
            await refreshToken(true);
            setAuthState('ready');
            setLastError(null);
            recoveryAttempts.current = 0;
          } catch (retryError) {
            handleAuthError(retryError);
          }
        }, authError.retryDelay);
      } else {
        setAuthState('error');
      }
    }
  }, [refreshToken, onAuthError]);

  // Recovery success handler
  const handleRecoverySuccess = useCallback(() => {
    setAuthState('ready');
    setLastError(null);
    recoveryAttempts.current = 0;
  }, []);

  // Check token health periodically
  React.useEffect(() => {
    if (!isReady) return;

    const checkTokenHealth = () => {
      if (!isTokenValid()) {
        handleAuthError(new Error('Token expired'));
      }
    };

    const interval = setInterval(checkTokenHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isReady, isTokenValid, handleAuthError]);

  // Render loading state
  if (!isReady) {
    return (
      <div className={`opacity-50 ${className}`}>
        {children}
      </div>
    );
  }

  // Render error recovery state
  if (authState === 'recovering' || authState === 'error') {
    return (
      <div className={className}>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
        <div className="mt-2">
          <AuthenticationRecovery
            onRecoverySuccess={handleRecoverySuccess}
          />
        </div>
      </div>
    );
  }

  // Render normal state
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Hook for using authentication within AuthenticatedComponent
 */
export const useAuthenticatedOperation = () => {
  const { refreshToken, isReady, isTokenValid } = useEnhancedTokenManager();

  const executeWithAuth = useCallback(async (
    operation: () => Promise<any>,
    onError?: (error: AuthError) => void
  ): Promise<any> => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Ensure fresh token before operation
        if (!isTokenValid()) {
          await refreshToken(true);
        }

        return await operation();
      } catch (error) {
        attempts += 1;
        const authError = analyzeAuthError(error, attempts);
        
        if (authError.isAuthError && authError.shouldRetry && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, authError.retryDelay));
          await refreshToken(true);
          continue;
        }

        onError?.(authError);
        throw new Error(authError.userMessage);
      }
    }

    throw new Error('Operation failed after multiple attempts');
  }, [refreshToken, isReady, isTokenValid]);

  return {
    executeWithAuth,
    isReady
  };
};