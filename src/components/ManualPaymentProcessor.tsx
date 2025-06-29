
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ManualPaymentProcessor = () => {
  const [webhookId, setWebhookId] = useState('evt_nJ934xH0o0m7HP1m3lYqi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const processPayment = async () => {
    if (!webhookId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      console.log('Processing webhook ID:', webhookId);
      
      const { data, error } = await supabase.functions.invoke('manual-payment-processing', {
        body: { webhook_id: webhookId.trim() }
      });

      if (error) {
        console.error('Error processing payment:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to process payment",
          variant: "destructive",
        });
        return;
      }

      console.log('Processing result:', data);
      setResult(data);

      if (data?.success) {
        toast({
          title: "Success",
          description: `Payment processed successfully! ${data.processing_result?.credits_awarded || 0} credits awarded.`,
        });
      } else {
        toast({
          title: "Warning",
          description: data?.message || "Payment processing completed with warnings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Manual Payment Processor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="webhook-id" className="text-sm font-medium">
            Webhook ID
          </label>
          <Input
            id="webhook-id"
            value={webhookId}
            onChange={(e) => setWebhookId(e.target.value)}
            placeholder="Enter webhook ID (e.g., evt_nJ934xH0o0m7HP1m3lYqi)"
          />
        </div>

        <Button 
          onClick={processPayment} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Process Payment'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Processing Result:</h3>
            <pre className="text-xs overflow-auto bg-white p-2 rounded border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualPaymentProcessor;
