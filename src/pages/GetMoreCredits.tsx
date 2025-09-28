import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { useCachedUserCredits } from '@/hooks/useCachedUserCredits';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Layout } from '@/components/Layout';
import UsageHistoryModal from '@/components/UsageHistoryModal';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useCachedLocationPricing } from '@/hooks/useCachedLocationPricing';
import { useCachedPaymentProducts } from '@/hooks/useCachedPaymentProducts';
import { useCheckoutSession } from '@/hooks/useCheckoutSession';
import { toast } from 'sonner';
import { useEnterpriseAuth } from '@/hooks/useEnterpriseAuth';
import { Analytics } from '@/utils/analytics';
const planGradientBg = {
  free: "bg-[#30313d] border border-gray-600",
  subscription: "bg-gradient-to-br from-[#2563eb] via-[#3893ec] to-[#1872ba] dark:from-[#274299] dark:via-[#3177c7] dark:to-[#1b466c]",
  pack: "bg-[#30313d] border border-gray-600"
};
const planTextColor = {
  free: "text-white",
  subscription: "text-cyan-100",
  pack: "text-white"
};
export default function GetMoreCredits() {
  const {
    user,
    isLoaded
  } = useUser();
  const navigate = useNavigate();

  // Use cached hooks for instant data display
  const {
    data: credits,
    isLoading: isCreditsLoading,
    error: creditsError,
    isShowingCachedData: isShowingCachedCredits
  } = useCachedUserCredits();
  const {
    userProfile
  } = useUserProfile();
  const {
    pricingData,
    isLoading: isPricingLoading,
    userCountry,
    isShowingCachedData: isShowingCachedPricing
  } = useCachedLocationPricing();
  const {
    creditPackProducts,
    isLoading: isProductsLoading,
    isShowingCachedData: isShowingCachedProducts
  } = useCachedPaymentProducts(pricingData?.region, pricingData?.currency);
  const {
    createCheckoutSession,
    isLoading: isCheckoutLoading
  } = useCheckoutSession();
  const {
    isAuthReady
  } = useEnterpriseAuth();

  // Connection and error state management
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Monitor for connection issues
  useEffect(() => {
    if (creditsError && !credits) {
      setConnectionIssue(true);
    } else if (credits) {
      setConnectionIssue(false);
    }
  }, [credits, creditsError]);
  const handleCreditPackClick = async (productId: string) => {
    if (!isAuthReady) {
      toast.error('Please wait, authentication is loading...');
      return;
    }

    // Find the product details for tracking
    const product = creditPackProducts.find(p => p.product_id === productId) || pricingData?.creditPacks.find(p => p.productId === productId);
    console.log('Buying credit pack with product:', productId);
    if (product) {
      const productDetails = {
        type: 'credit_pack' as const,
        price: 'price_amount' in product ? product.price_amount : product.price,
        currency: pricingData?.currency || 'USD',
        credits: 'credits_amount' in product ? product.credits_amount : product.credits
      };
      const session = await createCheckoutSession(productId, productDetails);
      if (!session?.url) {
        toast.error('Failed to create checkout session');
      }
    } else {
      const session = await createCheckoutSession(productId);
      if (!session?.url) {
        toast.error('Failed to create checkout session');
      }
    }
  };
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Manual refresh function - instant refresh for better UX
  const handleManualRefresh = useCallback(() => {
    try {
      // For connection issues, immediately force page refresh
      if (connectionIssue) {
        window.location.reload();
        return;
      }

      // For cached data scenarios, try refreshing and fall back quickly
      setTimeout(() => {
        if (connectionIssue) {
          window.location.reload();
        }
      }, 1000);
    } catch (err) {
      console.error('Manual refresh failed:', err);
      // Force page refresh if all else fails
      window.location.reload();
    }
  }, [connectionIssue]);

  // Get display data (cached data is already handled in the hooks)
  const currentBalance = credits ? Number(credits.current_balance) : 0;

  // Track pricing page view on mount
  useEffect(() => {
    Analytics.trackViewPricing();
  }, []);
  return <Layout>
      <div className="w-full flex flex-col pb-5 sm:pb-8">
        <div className="text-center mb-5 sm:mb-12 px-2 sm:px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl xs:text-4xl font-inter font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 mt-6 drop-shadow tracking-tight animate-fade-in sm:text-4xl">
                Pricing Plans
              </h1>
            </div>
            
            {/* Manual Refresh Button */}
            {connectionIssue && <Button onClick={handleManualRefresh} variant="outline" size="sm" className="text-xs bg-red-900/20 border-red-400/30 text-red-300 hover:bg-red-800/30">
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>}
          </div>
          <p className="text-gray-900 font-inter font-normal mb-1 sm:mb-2 animate-fade-in sm:text-base text-left text-sm">💬 Start with free monthly credits and upgrade anytime by purchasing flexible credit packs as you need. For any payment-related queries, feel free to reach out to us at &quot;support@aspirely.ai&quot; we're here to help!</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-base text-gray-800 font-inter animate-fade-in mt-2 md:mt-0 mb-2 sm:mb-0">
              Current Balance:{" "}
              {credits ? <span className="font-bold text-gray-900">
                  {currentBalance.toLocaleString()} credits
                </span> : <span className="font-bold text-gray-900">Loading...</span>}
            </p>
            <div className="flex items-center gap-2">
              <SubscriptionBadge credits={credits} />
              <UsageHistoryModal />
            </div>
          </div>
          
          {/* Payment Partner Information */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 justify-center">
            <span>Powered by</span>
            <span className="ml-1 font-semibold text-gray-800">Dodo Payments</span>
          </div>
          
          {/* Credit Information Section */}
          <div className="max-w-2xl mx-auto mb-6">
            <p className="text-gray-900 font-inter font-normal mb-4 sm:mb-6 animate-fade-in sm:text-base text-left text-sm">
              We work on a credit-based pricing system, and each feature uses the following credits:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-900">
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.1s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Job Alerts (0.1 credits each)</div>
                  <div className="text-gray-600">Personalized job notifications delivered to you</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.2s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Cover Letter (1.5 credits)</div>
                  <div className="text-gray-600">Personalized, human-tone PDF cover letter</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.3s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Resume (3 credits)</div>
                  <div className="text-gray-600">Customized PDF resume aligned with job posting</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.4s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Interview Prep (6 credits)</div>
                  <div className="text-gray-600">20-page PDF with tailored Q&A and strategies</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.5s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Job Fit Check (1 credit)</div>
                  <div className="text-gray-600">Detailed evaluation with personalized fit score</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.6s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Company Insights (3 credits)</div>
                  <div className="text-gray-600">Deep insights on company culture and expectations</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.7s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Visa Sponsorship Info (2 credits)</div>
                  <div className="text-gray-600">PDF guide for visa sponsorship clarity</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left animate-fade-in" style={{animationDelay: '0.8s'}}>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Connect with HRs (2 credits)</div>
                  <div className="text-gray-600">Direct recruiter profiles + tailored messages</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Responsive grid area with tight spacing for mobile; px for interior gap only */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-4">
          <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 items-stretch max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-blue-400/30 min-h-[320px]`}>
              <CardHeader className="text-center pb-2 pt-4 px-3">
                <div className="text-2xl font-extrabold text-white mb-1">Free</div>
                <div className="text-sm font-semibold text-gray-300">10 credits/month</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 pb-3">
                <div className="text-center my-3 flex-grow px-4">
                  <div className="text-center mb-3">
                    <span className="text-sm text-white">Access to all features + 2 free AI mock interviews</span>
                  </div>
                  
                  {/* Credit Usage Information Box */}
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600 mb-3 mt-6">
                    <div className="text-xs text-gray-300">
                      <div className="font-semibold text-cyan-400 mb-2">With 10 credits, you could get:</div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">100</span> job alerts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">6</span> cover letters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">3</span> resumes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">1</span> interview prep file</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">10</span> job fit checks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">3</span> company insights</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">5</span> visa sponsorship guides</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">5</span> HR contact lists</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex justify-center">
                  <Button className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl" disabled>
                    Current Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Credit Packs */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-indigo-400/30 min-h-[420px]`}>
              <CardHeader className="text-center pb-4 pt-6 px-4">
                <div className="text-3xl font-extrabold text-white mb-1">
                  ⚡ Power Pack
                </div>
                <div className="text-sm font-semibold text-gray-300">Get 200 credits instantly</div>
                <div className="text-xs text-gray-400 mt-1">Pay once • No expiry • No subscription</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-4 pb-4">
                <div className="flex flex-col gap-2 my-1 flex-grow max-w-md mx-auto">
                  {/* Show database products if available, otherwise show static fallback */}
                  {creditPackProducts.length > 0 ? 
                    creditPackProducts.filter(pack => pack.credits_amount === 200).map(pack => 
                      <div key={pack.product_id} className="rounded-md p-3 border border-gray-500 flex justify-between items-center shadow hover:shadow-md transition duration-300 bg-gray-700">
                        <div className="flex items-center gap-2">
                          {pricingData?.region === 'IN' ? (
                            <>
                              <span className="text-gray-400 text-xs line-through">₹799</span>
                              <span className="text-white font-bold text-lg">₹399</span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400 text-xs line-through">$19.99</span>
                              <span className="text-white font-bold text-lg">$9.99</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) :
                    // Only show fallback if no database products and not loading
                    !isProductsLoading && pricingData?.creditPacks.filter(pack => pack.credits === 200).map(pack => 
                      <div key={pack.credits} className="bg-gray-700 rounded-md p-3 border border-gray-500 flex justify-between items-center shadow hover:shadow-md transition duration-300">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs line-through">{pricingData?.currencySymbol}{pack.price * 2}</span>
                          <span className="text-white font-bold text-lg">{pricingData?.currencySymbol}{pack.price}</span>
                        </div>
                      </div>
                    )}
                  
                  {/* Loading state */}
                  {isProductsLoading && 
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                      <span className="ml-2 text-indigo-200 text-xs">Loading credit packs...</span>
                    </div>
                  }
                </div>
                
                {/* Features list */}
                <div className="flex flex-col items-center mb-3 mt-1">
                  {/* Credit Usage Information Box */}
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600 mb-3 w-full max-w-sm">
                    <div className="text-xs text-gray-300">
                      <div className="font-semibold text-cyan-400 mb-2">With 200 credits, you could get:</div>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">2,000</span> job alerts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">133</span> cover letters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">66</span> resumes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">33</span> interview prep files</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">200</span> job fit checks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">66</span> company insights</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">100</span> visa sponsorship guides</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                          <span>Up to <span className="font-bold">100</span> HR contact lists</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-1">
                    <li className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                      <div className="flex items-start gap-3">
                        <img src="/lovable-uploads/e5bac2d4-e5d9-4f9d-accf-c8ac205f690b.png" alt="Jobs that will vanish by 2030 e-book cover" className="w-20 h-28 object-contain rounded shadow-md flex-shrink-0" />
                        <div className="flex-grow">
                          <div className="text-cyan-400 font-semibold text-xs mb-1">FREE E-book:</div>
                          <div className="text-white font-medium text-xs mb-2">"Jobs that will vanish by 2030: 8 Strategies to Save Your Career Before AI Takes Over"</div>
                          <div className="text-gray-300 text-xs leading-relaxed">
                            Purchase any of the credit packs above and get a downloadable link sent via email from noreply@dodopayments.com
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            Instant access, read on any device, keep forever
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                {/* Buy Button with Dynamic Payment */}
                <div className="mt-auto flex justify-center">
                  {creditPackProducts.length > 0 ? 
                    creditPackProducts.filter(pack => pack.credits_amount === 200).map(pack => (
                      <Button 
                        key={pack.product_id}
                        onClick={() => handleCreditPackClick(pack.product_id)} 
                        className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl" 
                        disabled={!isAuthReady || connectionIssue || isCheckoutLoading(pack.product_id)}
                      >
                        {!isAuthReady ? '...' : isCheckoutLoading(pack.product_id) ? 
                          <Loader2 className="w-4 h-4 animate-spin" /> : 
                          <>Buy 200 Credits - {pricingData?.currencySymbol}{pack.price_amount}</>
                        }
                      </Button>
                    )) :
                    // Fallback for static data
                    !isProductsLoading && pricingData?.creditPacks.filter(pack => pack.credits === 200).map(pack => (
                      <Button 
                        key={pack.productId}
                        onClick={() => handleCreditPackClick(pack.productId)} 
                        className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl" 
                        disabled={!isAuthReady || connectionIssue || isCheckoutLoading(pack.productId)}
                      >
                        {!isAuthReady ? '...' : isCheckoutLoading(pack.productId) ? 
                          <Loader2 className="w-4 h-4 animate-spin" /> : 
                          <>Buy 200 Credits - {pricingData?.currencySymbol}{pack.price}</>
                        }
                      </Button>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>;
}