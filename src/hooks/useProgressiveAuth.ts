import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';

/**
 * Progressive authentication hook that provides immediate state
 * without blocking UI rendering
 */
export const useProgressiveAuth = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  useEffect(() => {
    // Only show skeleton for very brief moments during auth state changes
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setShowSkeleton(true);
      }, 200); // Wait 200ms before showing skeleton
      
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoaded]);

  return {
    isSignedIn: isLoaded ? isSignedIn : null, // null = unknown state
    isLoaded,
    user,
    showSkeleton: showSkeleton && !isLoaded,
    // Helper to determine if we should render optimistically
    shouldRender: isLoaded || !showSkeleton
  };
};