import { useState, useEffect } from 'react';
import { detectStorageCapabilities } from '@/utils/storageDetection';
import { CookiePreferences, ONLY_NECESSARY_PREFERENCES } from '@/types/cookieConsent';

interface CookieConsentState {
  hasConsent: boolean;
  needsConsent: boolean;
  hasStorageIssues: boolean;
  isLoading: boolean;
  preferences: CookiePreferences | null;
}

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    hasConsent: false,
    needsConsent: false,
    hasStorageIssues: false,
    isLoading: true,
    preferences: null
  });

  useEffect(() => {
    const checkConsentAndStorage = () => {
      try {
        // Check storage capabilities
        const capabilities = detectStorageCapabilities();
        const hasStorageIssues = !capabilities.localStorage || !capabilities.sessionStorage;
        
        // Check existing consent and preferences
        let hasConsent = false;
        let preferences: CookiePreferences | null = null;
        
        try {
          const consentData = localStorage.getItem('cookie-consent');
          const preferencesData = localStorage.getItem('cookie-preferences');
          
          hasConsent = consentData === 'accepted' || !!preferencesData;
          if (preferencesData) {
            preferences = JSON.parse(preferencesData);
          }
        } catch (e) {
          // localStorage not available
        }

        // Determine if we need to show consent banner
        const needsConsent = !hasConsent || hasStorageIssues;

        setState({
          hasConsent,
          needsConsent,
          hasStorageIssues,
          isLoading: false,
          preferences
        });
      } catch (error) {
        console.error('Error checking cookie consent:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkConsentAndStorage();
  }, []);

  const acceptAll = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    savePreferences(preferences);
  };

  const acceptNecessary = () => {
    savePreferences(ONLY_NECESSARY_PREFERENCES);
  };

  const savePreferences = (preferences: CookiePreferences) => {
    try {
      localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
      localStorage.setItem('cookie-consent', 'accepted');
    } catch (error) {
      console.warn('Could not save cookie preferences:', error);
    }
    
    setState(prev => ({ 
      ...prev, 
      hasConsent: true, 
      needsConsent: false,
      preferences 
    }));
  };

  const revokeConsent = () => {
    try {
      localStorage.removeItem('cookie-consent');
      localStorage.removeItem('cookie-preferences');
    } catch (error) {
      console.warn('Could not remove consent preferences:', error);
    }
    setState(prev => ({ 
      ...prev, 
      hasConsent: false, 
      needsConsent: true,
      preferences: null 
    }));
  };

  return {
    ...state,
    acceptAll,
    acceptNecessary,
    savePreferences,
    revokeConsent
  };
}