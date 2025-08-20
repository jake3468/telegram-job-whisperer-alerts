import React from 'react';

interface StorageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface StorageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary specifically for storage-related errors
 * Provides a fallback UI when storage operations fail
 */
export class StorageErrorBoundary extends React.Component<
  StorageErrorBoundaryProps,
  StorageErrorBoundaryState
> {
  constructor(props: StorageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StorageErrorBoundaryState {
    // Check if this is a storage-related error
    const isStorageError = 
      error.message.includes('Access denied') ||
      error.message.includes('localStorage') ||
      error.message.includes('sessionStorage') ||
      error.message.includes('storage') ||
      error.name === 'SecurityError' ||
      error.name === 'DOMException';

    if (isStorageError) {
      return { hasError: true, error };
    }

    // Re-throw non-storage errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Storage error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback or default fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Welcome to Aspirely.ai</h1>
            <p className="text-gray-300 mb-6">
              We're loading your job search platform. This works in all browsers, 
              including private/incognito mode.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}