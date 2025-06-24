
import { useJWTDebug } from '@/hooks/useJWTDebug';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const JWTDebugPanel = () => {
  const { runComprehensiveJWTTest } = useJWTDebug();
  const { isSignedIn, userId } = useAuth();

  const runFullTest = async () => {
    await runComprehensiveJWTTest();
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 bg-blue-900/90 border-blue-500/50 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-400">JWT Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs">
          <div>User ID: <span className="text-green-400">{userId}</span></div>
          <div>Status: <span className="text-green-400">JWT Debug Ready</span></div>
        </div>
        <Button 
          onClick={runFullTest}
          size="sm" 
          variant="outline"
          className="w-full text-xs border-blue-500/50 hover:border-blue-400"
        >
          Run Comprehensive JWT Test
        </Button>
        <div className="text-xs text-gray-400">
          Check browser console for detailed results
        </div>
      </CardContent>
    </Card>
  );
};

export default JWTDebugPanel;
