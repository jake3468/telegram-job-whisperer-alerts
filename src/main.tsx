
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Environment detection
const isProduction = window.location.hostname === 'aspirely.ai';
const isLovablePreview = window.location.hostname.includes('lovable.app');

// Select the appropriate Clerk key based on environment
const getClerkPublishableKey = () => {
  if (isProduction) {
    // Production key for aspirely.ai domain
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_PROD || "pk_live_Y2xlcmsuYXNwaXJlbHkuYWkk";
  } else if (isLovablePreview) {
    // Development key for Lovable preview
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV || "pk_test_bmF0dXJhbC1lZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA";
  } else {
    // Default to development key for localhost
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV || "pk_test_bmF0dXJhbC1lZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
};

const PUBLISHABLE_KEY = getClerkPublishableKey();

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Log environment info for debugging
console.log(`[Clerk Environment] Domain: ${window.location.hostname}`);
console.log(`[Clerk Environment] Using ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} Clerk key`);
console.log(`[Clerk Environment] Key prefix: ${PUBLISHABLE_KEY.substring(0, 10)}...`);

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
