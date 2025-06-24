
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';

const ClerkJWTSetupGuide = () => {
  const jwtTemplate = {
    "aud": "authenticated",
    "role": "authenticated"
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(jwtTemplate, null, 2));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-red-600">
          🚨 Clerk JWT Template Configuration Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Your Clerk JWT template needs to be configured for Supabase integration to work properly.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="font-medium">Required JWT Template Claims:</h3>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
            <pre>{JSON.stringify(jwtTemplate, null, 2)}</pre>
          </div>
          <Button 
            onClick={copyToClipboard}
            size="sm" 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Template
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to your Clerk Dashboard</li>
            <li>Navigate to JWT Templates</li>
            <li>Create or edit the "supabase" template</li>
            <li>Add the claims shown above</li>
            <li>Save the template</li>
            <li>Test the connection using the debug panels</li>
          </ol>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Important:</strong> Do NOT add a "sub" claim manually - Clerk handles this automatically. 
            Only add "aud" and "role" as shown above.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => window.open('https://dashboard.clerk.com', '_blank')}
          className="w-full flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Clerk Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClerkJWTSetupGuide;
