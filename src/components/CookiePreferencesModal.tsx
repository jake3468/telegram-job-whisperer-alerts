import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, BarChart3, Target, Settings } from 'lucide-react';
import { CookieCategory, CookiePreferences, DEFAULT_COOKIE_CATEGORIES } from '@/types/cookieConsent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences?: CookiePreferences;
}

const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'necessary': return Shield;
    case 'analytics': return BarChart3;
    case 'marketing': return Target;
    case 'preferences': return Settings;
    default: return Shield;
  }
};

export function CookiePreferencesModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialPreferences 
}: CookiePreferencesModalProps) {
  const [categories, setCategories] = useState<CookieCategory[]>(() => 
    DEFAULT_COOKIE_CATEGORIES.map(cat => ({
      ...cat,
      enabled: initialPreferences?.[cat.id as keyof CookiePreferences] ?? cat.enabled
    }))
  );

  const handleToggle = (categoryId: string, enabled: boolean) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled } : cat
      )
    );
  };

  const handleSave = () => {
    const preferences: CookiePreferences = {
      necessary: categories.find(cat => cat.id === 'necessary')?.enabled ?? true,
      analytics: categories.find(cat => cat.id === 'analytics')?.enabled ?? false,
      marketing: categories.find(cat => cat.id === 'marketing')?.enabled ?? false,
      preferences: categories.find(cat => cat.id === 'preferences')?.enabled ?? false,
    };
    onSave(preferences);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which cookies you'd like to accept. You can change these settings at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.id);
            
            return (
              <div key={category.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={category.id} className="font-medium">
                      {category.name}
                      {category.required && (
                        <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                      )}
                    </Label>
                    
                    <Switch
                      id={category.id}
                      checked={category.enabled}
                      onCheckedChange={(enabled) => handleToggle(category.id, enabled)}
                      disabled={category.required}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}