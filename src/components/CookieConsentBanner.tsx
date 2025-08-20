import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, Shield, AlertCircle, Settings } from 'lucide-react';
import { detectStorageCapabilities, getStorageErrorMessage, type StorageCapabilities } from '@/utils/storageDetection';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { CookiePreferences } from '@/types/cookieConsent';

interface CookieConsentBannerProps {
  onAcceptAll?: () => void;
  onAcceptNecessary?: () => void;
  onSavePreferences?: (preferences: CookiePreferences) => void;
}

export function CookieConsentBanner({ onAcceptAll, onAcceptNecessary, onSavePreferences }: CookieConsentBannerProps) {
  const [storageCapabilities, setStorageCapabilities] = useState<StorageCapabilities | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem('cookie-consent');
    if (hasConsent) return;

    // Detect storage capabilities
    const capabilities = detectStorageCapabilities();
    setStorageCapabilities(capabilities);

    // Show banner if storage is limited or after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = () => {
    setIsVisible(false);
    onAcceptAll?.();
  };

  const handleAcceptNecessary = () => {
    setIsVisible(false);
    onAcceptNecessary?.();
  };

  const handleManagePreferences = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = (preferences: CookiePreferences) => {
    setIsVisible(false);
    onSavePreferences?.(preferences);
  };

  const hasStorageIssues = storageCapabilities && 
    (!storageCapabilities.localStorage || !storageCapabilities.sessionStorage);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <Card className="max-w-2xl w-full p-6 bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {hasStorageIssues ? (
              <AlertCircle className="h-6 w-6 text-warning" />
            ) : (
              <Cookie className="h-6 w-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground">
                {hasStorageIssues ? 'Storage Access Required' : 'Cookie & Storage Consent'}
              </h3>
              
              {hasStorageIssues ? (
                <div className="mt-2 text-sm text-muted-foreground space-y-2">
                  <p className="text-warning font-medium">
                    {getStorageErrorMessage(storageCapabilities)}
                  </p>
                  <p>
                    Aspirely.ai requires browser storage for secure authentication. Please:
                  </p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Enable cookies in your browser settings</li>
                    <li>Allow local storage for this site</li>
                    <li>Try using a regular browser window (not private/incognito)</li>
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  We use cookies and local storage to provide secure authentication and improve your experience. 
                  This helps us keep you logged in and remember your preferences.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure & Private</span>
              </div>
              <span>•</span>
              <span>Required for authentication</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {hasStorageIssues ? (
                <Button onClick={handleAcceptNecessary} size="sm" className="flex-1">
                  I understand
                </Button>
              ) : (
                <>
                  <Button onClick={handleAcceptAll} size="sm" className="flex-1 sm:flex-none">
                    Accept All
                  </Button>
                  <Button onClick={handleAcceptNecessary} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    Only Necessary
                  </Button>
                  <Button onClick={handleManagePreferences} variant="ghost" size="sm" className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Manage
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      <CookiePreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
      />
    </div>
  );
}