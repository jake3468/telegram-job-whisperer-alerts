import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Settings, Cookie } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    functional: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyConsent(savedPreferences);
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      }
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply analytics consent
    if (prefs.analytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    // Store consent in localStorage for compliance
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true
    };
    setPreferences(allAccepted);
    applyConsent(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false
    };
    setPreferences(necessaryOnly);
    applyConsent(necessaryOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    applyConsent(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 bg-background/95 backdrop-blur-sm border-t">
        <Card className="max-w-6xl mx-auto p-3 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <Cookie className="h-4 w-4 sm:h-6 sm:w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Cookie Consent</h3>
              <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                <span className="sm:hidden">
                  We use cookies to enhance your experience. Manage preferences anytime.{' '}
                </span>
                <span className="hidden sm:inline">
                  We use cookies to enhance your experience on our website. This includes essential cookies for functionality, 
                  analytics cookies to understand how you interact with our site, and functional cookies to remember your preferences. 
                  You can manage your cookie preferences at any time.{' '}
                </span>
                <Link to="/cookie-policy" className="text-primary hover:underline">
                  <span className="sm:hidden">Learn more</span>
                  <span className="hidden sm:inline">Learn more in our Cookie Policy</span>
                </Link>
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-3">
                <Button onClick={handleAcceptAll} size="sm" className="text-xs sm:text-sm h-7 sm:h-8">
                  Accept All
                </Button>
                <Button onClick={handleAcceptNecessary} variant="outline" size="sm" className="text-xs sm:text-sm h-7 sm:h-8">
                  Necessary Only
                </Button>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm h-7 sm:h-8">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Cookie Preferences</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Cookie Categories</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose which types of cookies you want to allow. You can change these settings at any time.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="flex-1">
                            <Label htmlFor="necessary" className="font-medium">
                              Necessary Cookies
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Essential for the website to function properly. These cannot be disabled.
                            </p>
                          </div>
                          <Switch
                            id="necessary"
                            checked={preferences.necessary}
                            disabled
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor="analytics" className="font-medium">
                              Analytics Cookies
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Help us understand how visitors interact with our website through Google Analytics.
                            </p>
                          </div>
                          <Switch
                            id="analytics"
                            checked={preferences.analytics}
                            onCheckedChange={(checked) => updatePreference('analytics', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor="functional" className="font-medium">
                              Functional Cookies
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Remember your preferences and settings to improve your experience.
                            </p>
                          </div>
                          <Switch
                            id="functional"
                            checked={preferences.functional}
                            onCheckedChange={(checked) => updatePreference('functional', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label htmlFor="marketing" className="font-medium">
                              Marketing Cookies
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Currently not used. Reserved for future marketing and advertising purposes.
                            </p>
                          </div>
                          <Switch
                            id="marketing"
                            checked={preferences.marketing}
                            onCheckedChange={(checked) => updatePreference('marketing', checked)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleSavePreferences} className="flex-1">
                          Save Preferences
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowSettings(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};