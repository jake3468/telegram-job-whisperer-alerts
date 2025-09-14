import React, { Suspense, lazy } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// Lazy load Clerk components for better initial performance
const LazySignIn = lazy(() => import('@clerk/clerk-react').then(module => ({ 
  default: module.SignIn 
})));

const LazySignUp = lazy(() => import('@clerk/clerk-react').then(module => ({ 
  default: module.SignUp 
})));

interface OptimizedClerkProviderProps {
  children: React.ReactNode;
  publishableKey: string;
  signInFallbackRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
}

export const OptimizedClerkProvider: React.FC<OptimizedClerkProviderProps> = ({
  children,
  publishableKey,
  signInFallbackRedirectUrl,
  signUpFallbackRedirectUrl
}) => {
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        // Optimize for performance - remove unnecessary UI elements
        layout: {
          logoImageUrl: undefined,
          showOptionalFields: false,
          socialButtonsPlacement: 'bottom'
        },
        elements: {
          // Minimize initial CSS load
          rootBox: 'min-h-0',
          card: 'shadow-none border-0'
        }
      }}
      signInFallbackRedirectUrl={signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        {children}
      </Suspense>
    </ClerkProvider>
  );
};

// Optimized Clerk components with lazy loading
export const OptimizedSignIn = () => (
  <Suspense fallback={<div className="animate-pulse bg-muted h-96 rounded-lg" />}>
    <LazySignIn />
  </Suspense>
);

export const OptimizedSignUp = () => (
  <Suspense fallback={<div className="animate-pulse bg-muted h-96 rounded-lg" />}>
    <LazySignUp />
  </Suspense>
);