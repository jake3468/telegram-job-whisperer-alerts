
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Temporarily disable security headers for debugging
// import { securityHeaders } from '@/utils/securityHeaders'
// securityHeaders.setSecurityHeaders();

// Environment detection
const isProduction = window.location.hostname === 'aspirely.ai';
const isLovablePreview = window.location.hostname.includes('lovable.app');

// Select the appropriate Clerk key based on environment
const getClerkPublishableKey = () => {
  if (isProduction) {
    // Production key for aspirely.ai domain
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_PROD || "pk_live_Y2xlcmsuYXNwaXJlbHkuYWkk";
  } else {
    // Development key for Lovable preview and localhost
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV || "pk_test_bmF0dXJhbC1lZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA";
  }
};

const PUBLISHABLE_KEY = getClerkPublishableKey();

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Environment setup complete

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
