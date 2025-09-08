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
  
  return {
    isSignedIn: isLoaded ? isSignedIn : null, // null = unknown state
    isLoaded,
    user,
    showSkeleton: !isLoaded,
    // Helper to determine if we should render optimistically
    shouldRender: true // Always render content immediately
  };
};