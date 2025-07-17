import { useState } from 'react';
import { useAIInterviewProducts, AIInterviewProduct } from '@/hooks/useAIInterviewProducts';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Loader2, Star, CheckCircle } from 'lucide-react';

interface AIInterviewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export const AIInterviewPurchaseModal = ({ 
  isOpen, 
  onClose, 
  onPurchaseSuccess 
}: AIInterviewPurchaseModalProps) => {
  const { products, isLoading, currencySymbol } = useAIInterviewProducts();
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const handlePurchase = async (product: AIInterviewProduct) => {
    try {
      setProcessingProductId(product.product_id);

      logger.info('Starting purchase for AI interview pack:', { product_id: product.product_id });

      // Get Clerk JWT token using useAuth hook (same as main checkout flow)
      const clerkToken = await getToken();
      if (!clerkToken) {
        throw new Error('Failed to get authentication token');
      }

      // Use direct fetch with Clerk token (consistent with main flow)
      const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ 
          productId: product.product_id,  // Use productId for consistency
          quantity: 1 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from checkout session:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Opening Stripe checkout in a new tab...",
        });

        // Close modal and call success callback
        onClose();
        onPurchaseSuccess?.();
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setProcessingProductId(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const displayPrice = currency === 'INR' ? price / 100 : price / 100;
    return `${currencySymbol}${displayPrice.toFixed(currency === 'INR' ? 0 : 2)}`;
  };

  const getPopularProduct = () => {
    // Find product with most credits or middle product
    const sortedByCredits = [...products].sort((a, b) => b.credits_amount - a.credits_amount);
    return sortedByCredits[Math.floor(sortedByCredits.length / 2)] || sortedByCredits[0];
  };

  const getDiscountText = (product: AIInterviewProduct) => {
    if (product.discount && product.discount > 0) {
      const perCallSavings = product.savings! / product.credits_amount;
      const displaySavings = product.currency === 'INR' ? perCallSavings / 100 : perCallSavings / 100;
      return `Save ${product.discount}% (${currencySymbol}${displaySavings.toFixed(product.currency === 'INR' ? 0 : 2)} per call)`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Phone className="h-6 w-6 text-primary" />
            AI Mock Interview Credits
          </DialogTitle>
          <DialogDescription>
            Choose a package to continue practicing with Grace, your AI interview assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {products.map((product) => {
            const isPopular = getPopularProduct()?.id === product.id;
            const discount = product.discount || 0;
            
            return (
              <Card 
                key={product.id} 
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isPopular ? 'ring-2 ring-primary border-primary' : 'border-border'
                }`}
                onClick={() => !processingProductId && handlePurchase(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {product.credits_amount} Interview Call{product.credits_amount > 1 ? 's' : ''}
                      </h3>
                      {isPopular && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <Star className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                      {discount > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {discount}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(product.price_amount, product.currency)}
                      </div>
                      {discount > 0 && product.originalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice, product.currency)}
                        </div>
                      )}
                    </div>

                    {discount > 0 && product.savings && (
                      <div className="text-sm text-green-600 font-medium mb-2">
                        Save {formatPrice(product.savings, product.currency)}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      {formatPrice(product.price_amount / product.credits_amount, product.currency)} per interview
                      {getDiscountText(product) && (
                        <div className="text-green-600 font-medium mt-1">
                          {getDiscountText(product)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      disabled={!!processingProductId}
                      className="min-w-[120px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(product);
                      }}
                    >
                      {processingProductId === product.product_id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">What you get:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Real phone calls with Grace AI</li>
            <li>• Personalized interview questions</li>
            <li>• Detailed feedback reports</li>
            <li>• Performance scoring and analysis</li>
            <li>• Credits never expire</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};