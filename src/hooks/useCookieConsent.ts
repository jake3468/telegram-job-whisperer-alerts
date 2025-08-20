import { useState, useEffect } from 'react';
import { detectStorageCapabilities } from '@/utils/storageDetection';

interface CookieConsentState {
  hasConsent: boolean;
  needsConsent: boolean;
  hasStorageIssues: boolean;
  isLoading: boolean;
}

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    hasConsent: false,
    needsConsent: false,
    hasStorageIssues: false,
    isLoading: true
  });

  useEffect(() => {
    const checkConsentAndStorage = () => {
      try {
        // Check storage capabilities
        const capabilities = detectStorageCapabilities();
        const hasStorageIssues = !capabilities.localStorage || !capabilities.sessionStorage;
        
        // Check existing consent
        let hasConsent = false;
        try {
          hasConsent = localStorage.getItem('cookie-consent') === 'accepted';
        } catch (e) {
          // localStorage not available
        }

        // Determine if we need to show consent banner
        const needsConsent = !hasConsent || hasStorageIssues;

        setState({
          hasConsent,
          needsConsent,
          hasStorageIssues,
          isLoading: false
        });
      } catch (error) {
        console.error('Error checking cookie consent:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkConsentAndStorage();
  }, []);

  const grantConsent = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted');
      setState(prev => ({ ...prev, hasConsent: true, needsConsent: false }));
    } catch (error) {
      console.warn('Could not save consent preference:', error);
      // Still update state to reflect user's choice
      setState(prev => ({ ...prev, hasConsent: true, needsConsent: false }));
    }
  };

  const revokeConsent = () => {
    try {
      localStorage.removeItem('cookie-consent');
    } catch (error) {
      console.warn('Could not remove consent preference:', error);
    }
    setState(prev => ({ ...prev, hasConsent: false, needsConsent: true }));
  };

  return {
    ...state,
    grantConsent,
    revokeConsent
  };
}