import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie, Shield, AlertCircle } from 'lucide-react';
import { detectStorageCapabilities, getStorageErrorMessage, type StorageCapabilities } from '@/utils/storageDetection';

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function CookieConsentBanner({ onAccept, onDecline }: CookieConsentBannerProps) {
  const [storageCapabilities, setStorageCapabilities] = useState<StorageCapabilities | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted');
    } catch (e) {
      // If localStorage fails, at least hide the banner
      console.warn('Could not save consent preference');
    }
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline?.();
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

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleAccept} size="sm" className="flex-1 sm:flex-none">
                {hasStorageIssues ? 'I understand' : 'Accept & Continue'}
              </Button>
              
              {!hasStorageIssues && (
                <Button onClick={handleDecline} variant="outline" size="sm">
                  Decline
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}