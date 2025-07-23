import { useCallback, useEffect, useRef, useState } from 'react';
import { useEnterpriseUserPresence } from './useEnterpriseUserPresence';
import { useEnterpriseAPIClient } from './useEnterpriseAPIClient';
import { useToast } from '@/hooks/use-toast';

interface FormManagerConfig {
  // Pre-submission validation
  enablePreValidation?: boolean;
  validationDelay?: number;
  
  // Auto-save configuration
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  
  // Connection recovery
  enableConnectionRecovery?: boolean;
  maxRetryAttempts?: number;
  retryDelays?: number[];
  
  // Session management
  enableProactiveRefresh?: boolean;
  refreshBeforeSubmit?: boolean;
}

const DEFAULT_CONFIG: FormManagerConfig = {
  enablePreValidation: true,
  validationDelay: 500,
  enableAutoSave: false,
  autoSaveDelay: 2000,
  enableConnectionRecovery: true,
  maxRetryAttempts: 3,
  retryDelays: [1000, 2000, 4000],
  enableProactiveRefresh: true,
  refreshBeforeSubmit: true
};

interface FormSubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retryAttempt?: number;
  recoveryAction?: 'token_refresh' | 'connection_retry' | 'none';
}

/**
 * Universal form manager that provides enterprise-grade reliability for ALL form operations
 * Ensures consistent behavior across Bio, Job Alerts, and all future forms
 */
export const useUniversalFormManager = <T = any>(config: Partial<FormManagerConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { toast } = useToast();
  
  // Enhanced presence detection with form-specific settings
  const {
    isActive,
    connectionHealth,
    tokenStatus,
    recordFormInteraction,
    forceTokenRefresh,
    isConnectionHealthy,
    isTokenValid
  } = useEnterpriseUserPresence({
    heartbeatInterval: 90 * 1000, // 1.5 minutes for forms
    trackFormInteractions: true,
    formFocusWeight: 4 // High weight for form interactions
  });

  // Enterprise API client
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();

  // Form state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<FormSubmissionResult<T> | null>(null);
  
  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(fullConfig.enableAutoSave || false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Pre-submission token refresh
  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    if (!fullConfig.enableProactiveRefresh) return true;
    
    try {
      // Check token validity
      if (!isTokenValid || connectionHealth !== 'healthy') {
        console.log('[UniversalFormManager] Pre-submission session validation...');
        await forceTokenRefresh();
        
        // Wait a moment for token to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('[UniversalFormManager] Session validation failed:', error);
      return false;
    }
  }, [isTokenValid, connectionHealth, forceTokenRefresh, fullConfig.enableProactiveRefresh]);

  // Enterprise-grade form submission with comprehensive error handling
  const submitForm = useCallback(async <R = T>(
    operation: () => Promise<R>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      enableRecovery?: boolean;
      onSuccess?: (data: R) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<FormSubmissionResult<R>> => {
    const {
      successMessage = "Operation completed successfully",
      errorMessage = "Operation failed",
      enableRecovery = fullConfig.enableConnectionRecovery,
      onSuccess,
      onError
    } = options;

    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    
    // Record form interaction
    recordFormInteraction('submit');

    try {
      // Pre-submission session validation
      if (fullConfig.refreshBeforeSubmit) {
        const sessionValid = await ensureValidSession();
        if (!sessionValid) {
          throw new Error('Session validation failed. Please refresh the page and try again.');
        }
      }

      console.log('[UniversalFormManager] Executing form submission...');
      
      // Execute the operation with enterprise-grade retry logic
      const result = await makeAuthenticatedRequest(operation, {
        maxRetries: enableRecovery ? fullConfig.maxRetryAttempts : 1,
        retryDelays: fullConfig.retryDelays,
        silentRetry: enableRecovery
      });

      // Success handling
      const successResult: FormSubmissionResult<R> = {
        success: true,
        data: result,
        retryAttempt: submitAttempts,
        recoveryAction: 'none'
      };

      setLastSubmissionResult(successResult as unknown as FormSubmissionResult<T>);
      onSuccess?.(result);
      
      toast({
        title: "Success",
        description: successMessage,
      });

      console.log('[UniversalFormManager] Form submission successful');
      return successResult;

    } catch (error: any) {
      console.error('[UniversalFormManager] Form submission failed:', error);
      
      // Determine recovery action
      let recoveryAction: FormSubmissionResult<R>['recoveryAction'] = 'none';
      
      if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
        recoveryAction = 'token_refresh';
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        recoveryAction = 'connection_retry';
      }

      // Error result
      const errorResult: FormSubmissionResult<R> = {
        success: false,
        error: error?.message || errorMessage,
        retryAttempt: submitAttempts,
        recoveryAction
      };

      setLastSubmissionResult(errorResult as unknown as FormSubmissionResult<T>);
      onError?.(error?.message || errorMessage);
      
      // Show user-friendly error message
      toast({
        title: "Error",
        description: error?.message || errorMessage,
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    makeAuthenticatedRequest,
    ensureValidSession,
    recordFormInteraction,
    submitAttempts,
    toast,
    fullConfig.enableConnectionRecovery,
    fullConfig.maxRetryAttempts,
    fullConfig.retryDelays,
    fullConfig.refreshBeforeSubmit
  ]);

  // Auto-save functionality for long forms
  const scheduleAutoSave = useCallback((operation: () => Promise<void>, delay = fullConfig.autoSaveDelay) => {
    if (!autoSaveEnabled) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[UniversalFormManager] Auto-save triggered');
        await operation();
      } catch (error) {
        console.error('[UniversalFormManager] Auto-save failed:', error);
      }
    }, delay);
  }, [autoSaveEnabled, fullConfig.autoSaveDelay]);

  // Form field change handler with activity tracking
  const handleFieldChange = useCallback((field: string, value: any, autoSaveOperation?: () => Promise<void>) => {
    // Record form interaction
    recordFormInteraction('input');
    
    // Schedule auto-save if enabled and operation provided
    if (autoSaveOperation) {
      scheduleAutoSave(autoSaveOperation);
    }
    
    console.log(`[UniversalFormManager] Field changed: ${field}`);
  }, [recordFormInteraction, scheduleAutoSave]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Form submission
    submitForm,
    isSubmitting,
    submitAttempts,
    lastSubmissionResult,
    
    // Field management
    handleFieldChange,
    scheduleAutoSave,
    
    // Auto-save controls
    autoSaveEnabled,
    setAutoSaveEnabled,
    
    // Session status
    isSessionValid: isTokenValid && isConnectionHealthy,
    connectionHealth,
    tokenStatus,
    forceTokenRefresh,
    
    // Activity tracking
    recordFormInteraction,
    isUserActive: isActive,
    
    // Recovery helpers
    ensureValidSession,
    
    // Statistics
    formStats: {
      totalAttempts: submitAttempts,
      lastResult: lastSubmissionResult,
      sessionHealth: connectionHealth,
      tokenStatus: tokenStatus,
      autoSaveActive: autoSaveEnabled
    }
  };
};