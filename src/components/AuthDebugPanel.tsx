
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthDebugPanel = () => {
  const { user } = useUser();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugCheck = async () => {
    setLoading(true);
    try {
      // Check if we can call the debug function
      const { data, error } = await supabase
        .rpc('debug_user_auth');
      
      console.log('Debug auth result:', { data, error });
      
      setDebugInfo({
        clerkUser: {
          id: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
        },
        supabaseDebug: data,
        error: error?.message
      });
    } catch (err) {
      console.error('Debug check failed:', err);
      setDebugInfo({
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="m-4 border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-800">🔧 Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runDebugCheck} disabled={loading} className="mb-4">
          {loading ? 'Checking...' : 'Run Auth Debug Check'}
        </Button>
        
        {debugInfo && (
          <div className="space-y-2 text-sm">
            <div><strong>Clerk User ID:</strong> {debugInfo.clerkUser?.id}</div>
            <div><strong>Email:</strong> {debugInfo.clerkUser?.email}</div>
            
            {debugInfo.supabaseDebug && (
              <>
                <div><strong>Clerk ID from JWT:</strong> {debugInfo.supabaseDebug[0]?.clerk_id || 'null'}</div>
                <div><strong>User Exists in DB:</strong> {debugInfo.supabaseDebug[0]?.user_exists ? 'Yes' : 'No'}</div>
                <div><strong>User ID Found:</strong> {debugInfo.supabaseDebug[0]?.user_id_found || 'null'}</div>
              </>
            )}
            
            {debugInfo.error && (
              <div className="text-red-600"><strong>Error:</strong> {debugInfo.error}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
