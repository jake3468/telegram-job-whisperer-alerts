import { useState } from 'react';
import { useAIInterviewProducts, AIInterviewProduct } from '@/hooks/useAIInterviewProducts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Loader2, Star, Crown } from 'lucide-react';

interface AIInterviewPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIInterviewPricingModal = ({ 
  isOpen, 
  onClose
}: AIInterviewPricingModalProps) => {
  const { products, isLoading, currencySymbol } = useAIInterviewProducts();
  const [selectedProduct, setSelectedProduct] = useState<AIInterviewProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (product: AIInterviewProduct) => {
    try {
      setIsPurchasing(true);
      setSelectedProduct(product);

      logger.info('Starting purchase for AI interview pack:', { product_id: product.product_id });

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          product_id: product.product_id,
          quantity: 1
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open payment page in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Opening secure payment page in a new tab...",
        });

        // Close modal
        onClose();
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
      setIsPurchasing(false);
      setSelectedProduct(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    // Fix price formatting - prices should be displayed as actual amounts like ₹299, $4.99
    return `${currencySymbol}${currency === 'INR' ? price.toFixed(0) : price.toFixed(2)}`;
  };

  // Create free plan entry
  const freePlan = {
    credits_amount: 2,
    price_amount: 0,
    currency: products[0]?.currency || 'USD',
    isFree: true
  };

  // Get all plans including free plan
  const allPlans = [freePlan, ...products];

  // Find most popular (3 credits plan)
  const getMostPopularPlan = () => {
    return products.find(p => p.credits_amount === 3);
  };

  const mostPopular = getMostPopularPlan();

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading pricing...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] lg:w-[900px] xl:w-[1000px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-background via-background to-primary/5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 hover:bg-background transition-colors"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-center gap-3 text-xl sm:text-2xl font-bold text-primary">
            <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
            AI Mock Interview Pricing
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
            Choose the perfect plan for your interview preparation needs
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing cards grid - compact layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
            {allPlans.map((plan, index) => {
              const isFreePlan = 'isFree' in plan;
              const isMostPopular = !isFreePlan && mostPopular?.id === (plan as AIInterviewProduct).id;
              const discount = !isFreePlan ? (plan as AIInterviewProduct).discount || 0 : 0;
              
              return (
                <div 
                  key={isFreePlan ? 'free-plan' : (plan as AIInterviewProduct).id}
                  className={`relative rounded-xl border-2 p-4 text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] min-h-[320px] flex flex-col justify-between ${
                    isFreePlan 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm' 
                      : isMostPopular 
                        ? 'border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-md scale-105 ring-1 ring-primary/20' 
                        : 'border-border bg-gradient-to-br from-background to-secondary/30 hover:border-primary/50 shadow-sm'
                  }`}
                >
                  {/* Top badges */}
                  {isFreePlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-500 text-white border-0 shadow-md px-4 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  {isMostPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground border-0 shadow-md px-4 py-1">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Discount badge */}
                  {!isFreePlan && discount > 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-orange-500 text-white border-0 shadow-md text-sm px-3 py-1">
                        {discount}% OFF
                      </Badge>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    {/* Credits count with icon */}
                    <div className="space-y-2">
                      <div className={`text-4xl font-bold ${
                        isFreePlan ? 'text-green-600' : isMostPopular ? 'text-primary' : 'text-foreground'
                      }`}>
                        {plan.credits_amount}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Interview Call{plan.credits_amount > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Price display */}
                    <div className="space-y-1">
                      {isFreePlan ? (
                        <div className="text-3xl font-bold text-green-600">FREE</div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold">
                            {formatPrice(plan.price_amount, plan.currency)}
                          </div>
                          {discount > 0 && (plan as AIInterviewProduct).originalPrice && (
                            <div className="text-lg text-muted-foreground line-through">
                              {formatPrice((plan as AIInterviewProduct).originalPrice!, plan.currency)}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Per call price */}
                    <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                      {isFreePlan 
                        ? '$0 per interview'
                        : `${formatPrice(plan.price_amount / plan.credits_amount, plan.currency)} per interview`
                      }
                    </div>

                    {/* Savings highlight */}
                    {!isFreePlan && discount > 0 && (plan as AIInterviewProduct).savings && (
                      <div className="text-sm font-semibold text-green-600 bg-green-50 rounded-lg px-3 py-2">
                        💰 Save {formatPrice((plan as AIInterviewProduct).savings!, plan.currency)}
                      </div>
                    )}

                    {/* Action button */}
                    <div className="pt-2">
                      {isFreePlan ? (
                        <Button 
                          variant="outline" 
                          className="w-full h-10 bg-green-100 border-green-300 text-green-700 hover:bg-green-200 text-base font-semibold" 
                          disabled
                        >
                          ✓ Current Plan
                        </Button>
                      ) : (
                        <Button
                          className={`w-full h-10 text-base font-semibold transition-all duration-200 ${
                            isMostPopular 
                              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl' 
                              : 'bg-foreground hover:bg-foreground/90 text-background shadow-md hover:shadow-lg'
                          }`}
                          disabled={isPurchasing}
                          onClick={() => handlePurchase(plan as AIInterviewProduct)}
                        >
                          {isPurchasing && selectedProduct?.id === (plan as AIInterviewProduct).id ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {isMostPopular && <Crown className="h-5 w-5 mr-2" />}
                              Buy Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features section */}
          <div className="bg-gradient-to-r from-secondary/30 to-primary/10 rounded-2xl p-6 border border-border/50">
            <h4 className="font-semibold mb-4 text-center text-lg">✨ What's included in every plan:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Real phone calls with Grace AI</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Personalized interview questions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Detailed feedback reports</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Performance scoring and analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Credits never expire</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-foreground">Secure payment processing</span>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              💯 All purchases are secure and backed by our satisfaction guarantee
            </div>
            <div className="text-xs text-muted-foreground">
              🔒 Payment processed securely via Dodo Payments • 📞 Start your interviews immediately
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};