import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { testJWTTransmission } from '@/integrations/supabase/client';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const JWTDebugPanel = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const sessionManager = useEnhancedTokenManagerIntegration();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runJWTTest = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Starting JWT Debug Test...');
      
      // Step 1: Check Clerk authentication
      const clerkToken = await getToken({ template: 'supabase' });
      console.log('📋 Clerk Token:', clerkToken ? '✅ Present' : '❌ Missing');
      
      // Step 2: Check session manager
      const sessionToken = sessionManager?.getCurrentToken();
      console.log('🔑 Session Manager Token:', sessionToken ? '✅ Present' : '❌ Missing');
      
      // Step 3: Test JWT transmission to Supabase
      const jwtTest = await testJWTTransmission();
      console.log('🚀 JWT Transmission Test:', jwtTest);
      
      // Step 4: Compile debug info
      const info = {
        clerk: {
          isLoaded,
          isSignedIn: !!user,
          userId: user?.id,
          hasToken: !!clerkToken,
          tokenLength: clerkToken?.length || 0
        },
        sessionManager: {
          isReady: sessionManager?.isReady,
          hasToken: !!sessionToken,
          isTokenValid: sessionManager?.isTokenValid?.(),
          sessionStats: sessionManager?.sessionStats
        },
        supabaseTest: jwtTest
      };
      
      setDebugInfo(info);
      console.log('📊 Complete Debug Info:', info);
      
    } catch (error) {
      console.error('❌ JWT Debug Test Error:', error);
      setDebugInfo({ error: error.message });
    }
    setIsLoading(false);
  };

  // Auto-run test when component mounts and user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      runJWTTest();
    }
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <p>Loading authentication...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>JWT Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runJWTTest} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test JWT Transmission'}
          </Button>
          
          {debugInfo && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Debug Results:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};