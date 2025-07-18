
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const TestServiceRoleAccess = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testServiceRoleAccess = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Testing service role access to company_role_analyses table...');
      
      // Use the full Supabase URL for the edge function
      const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/test-company-analysis-write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuemxveXloemhycXN2c2xoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MzAyMjIsImV4cCI6MjA2NDUwNjIyMn0.xdlgb_amJ1fV31uinCFotGW00isgT5-N8zJ_gLHEKuk`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(responseText);
      setResult(data);

      if (data.success) {
        toast({
          title: "Test Passed",
          description: "Service role can access company_role_analyses table successfully",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Service role access test failed",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Error",
        description: "Failed to run service role test",
        variant: "destructive"
      });
      setResult({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Service Role Access Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testServiceRoleAccess} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Service Role Access'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Test Result:</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
