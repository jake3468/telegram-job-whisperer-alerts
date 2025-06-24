
import { useClerkSupabaseDebug } from '@/hooks/useClerkSupabaseDebug';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthDebugPanel = () => {
  const { debugClerkSupabaseIntegration } = useClerkSupabaseDebug();
  const { isSignedIn, userId } = useAuth();

  const runDebugTest = async () => {
    await debugClerkSupabaseIntegration();
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-black/90 border-red-500/50 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-400">Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs">
          <div>Clerk ID: <span className="text-green-400">{userId}</span></div>
          <div>Status: <span className="text-green-400">Signed In</span></div>
        </div>
        <Button 
          onClick={runDebugTest}
          size="sm" 
          variant="outline"
          className="w-full text-xs border-red-500/50 hover:border-red-400"
        >
          Run Debug Test
        </Button>
        <div className="text-xs text-gray-400">
          Check browser console for results
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugPanel;
