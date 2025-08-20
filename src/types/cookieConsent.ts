export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const DEFAULT_COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    name: 'Necessary',
    description: 'Essential cookies required for authentication and core site functionality.',
    required: true,
    enabled: true
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Help us understand how you use our site to improve your experience.',
    required: false,
    enabled: false
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Used to personalize content and show relevant advertisements.',
    required: false,
    enabled: false
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Remember your settings and preferences for a better experience.',
    required: false,
    enabled: false
  }
];

export const ONLY_NECESSARY_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false
};

export const ACCEPT_ALL_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  marketing: true,
  preferences: true
};