
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'
import { ClerkErrorBoundary } from './components/ClerkErrorBoundary'
import { detectStorageCapabilities, getStorageErrorMessage } from './utils/storageDetection'
import { CookieConsentBanner } from './components/CookieConsentBanner'

// Temporarily disable security headers for debugging
// import { securityHeaders } from '@/utils/securityHeaders'
// securityHeaders.setSecurityHeaders();

// Environment detection
const isProduction = window.location.hostname === 'aspirely.ai' || window.location.hostname === 'www.aspirely.ai';
const isLovablePreview = window.location.hostname.includes('lovable.app');

// Select the appropriate Clerk key based on environment
const getClerkPublishableKey = () => {
  console.log('[CLERK DEBUG] Environment detection:', {
    hostname: window.location.hostname,
    isProduction,
    isLovablePreview
  });
  
  if (isProduction) {
    // Production key for aspirely.ai and www.aspirely.ai domains
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_PROD || "pk_live_Y2xlcmsuYXNwaXJlbHkuYWkk";
    console.log('[CLERK DEBUG] Using production key:', key.substring(0, 20) + '...');
    return key;
  } else {
    // Development key for Lovable preview and localhost
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV || "pk_test_bmF0dXJhbC1lZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA";
    console.log('[CLERK DEBUG] Using development key:', key.substring(0, 20) + '...');
    return key;
  }
};

const PUBLISHABLE_KEY = getClerkPublishableKey();

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Check storage capabilities
const storageCapabilities = detectStorageCapabilities();
console.log('[STORAGE] Capabilities detected:', storageCapabilities);

if (!storageCapabilities.localStorage && !storageCapabilities.sessionStorage) {
  console.error('[STORAGE] Critical storage unavailable:', getStorageErrorMessage(storageCapabilities));
}

// Environment setup complete

createRoot(document.getElementById("root")!).render(
  <ClerkErrorBoundary>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        // Optimize for faster loading
        layout: {
          logoImageUrl: undefined, // Skip logo loading for faster init
          showOptionalFields: false
        }
      }}
    >
      <App />
        <CookieConsentBanner 
          onAcceptAll={() => console.log('Accepted all cookies')}
          onAcceptNecessary={() => console.log('Accepted necessary cookies only')}
          onSavePreferences={(prefs) => console.log('Saved preferences:', prefs)}
        />
    </ClerkProvider>
  </ClerkErrorBoundary>
);
