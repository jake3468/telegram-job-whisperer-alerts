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
    const product = creditPackProducts.find(p => p.product_id === productId) || 
                   pricingData?.creditPacks.find(p => p.productId === productId);
    
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
              <h1 className="text-2xl xs:text-3xl font-orbitron font-extrabold bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text mb-1 sm:mb-2 drop-shadow tracking-tight animate-fade-in text-sky-400 sm:text-4xl">
                Flexible Pricing Plans
              </h1>
            </div>
            
            {/* Manual Refresh Button */}
            {connectionIssue && <Button onClick={handleManualRefresh} variant="outline" size="sm" className="text-xs bg-red-900/20 border-red-400/30 text-red-300 hover:bg-red-800/30">
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>}
          </div>
          <p className="text-blue-100 font-inter font-light mb-1 sm:mb-2 animate-fade-in sm:text-base text-left text-sm">💬 Start with free monthly credits and upgrade anytime - either by purchasing flexible credit packs or a monthly subscription. For any payment-related queries, feel free to reach out to us at &quot;support@aspirely.ai&quot; we're here to help! </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-base text-cyan-200 font-inter animate-fade-in">
              Current Balance:{" "}
              {credits ? <span className="font-bold text-cyan-100">
                  {currentBalance.toLocaleString()} credits
                </span> : <span className="font-bold text-cyan-100">Loading...</span>}
            </p>
            <div className="flex items-center gap-2">
              <SubscriptionBadge credits={credits} />
              <UsageHistoryModal />
            </div>
          </div>
          
          {/* Payment Partner Information */}
          <div className="flex items-center gap-2 text-sm text-blue-200 mb-4 justify-center">
            <span>Powered by</span>
            <span className="ml-1 font-semibold text-blue-100">Dodo Payments</span>
          </div>
        </div>
        
        {/* Responsive grid area with tight spacing for mobile; px for interior gap only */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-2 sm:px-4">
          <div className={`
              grid gap-3 sm:gap-4 
              w-full
              grid-cols-1
              lg:grid-cols-2
              items-stretch
              duration-500
            `}>
            {/* Free Plan */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-blue-400/30 min-h-[320px] sm:min-h-[380px]`}>
              <CardHeader className="text-center pb-2 pt-3 sm:pb-4 sm:pt-6 px-3 sm:px-4">
                <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 ${planTextColor.free}`}>Free Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 mb-0.5">Free</div>
                <div className="mt-0 text-xs sm:text-sm font-semibold text-gray-300">10 credits/month</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 sm:px-4 pb-3">
                <ul className="space-y-1 sm:space-y-2 my-2 sm:my-4 flex-grow">
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-xs sm:text-sm text-white">Access to all features</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-xs sm:text-sm text-white">10 credits every month (auto-renewal)</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-xs sm:text-sm text-white">Perfect for occasional use</span>
                  </li>
                  <li className="mt-2 sm:mt-3">
                    <div className="text-xs sm:text-sm font-semibold text-cyan-300 mb-1 sm:mb-2">What You Can Do Each Month:</div>
                    <ul className="space-y-1 ml-3 sm:ml-4">
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Create 2 Resumes</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Create 9 Cover Letters</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Run 10 Job Fit Checks</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Access 3 Company Insights</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">View 5 HR Profiles</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Check 5 Visa Info</span>
                      </li>
                      <li className="flex items-center gap-1 sm:gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-black" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white">Practice 1 Interview Prep</span>
                      </li>
                    </ul>
                  </li>
                </ul>
                <div className="mt-auto">
                  <Button className="w-full py-2 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-orbitron text-xs sm:text-sm shadow border-0" disabled>
                    Current Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Credit Packs - Region-specific products only */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-indigo-400/30 min-h-[320px] sm:min-h-[380px]`}>
              <CardHeader className="text-center pb-2 pt-3 sm:pb-4 sm:pt-6 px-3 sm:px-4">
                <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 ${planTextColor.pack}`}>Credit Packs</CardTitle>
                 <div className="text-2xl sm:text-3xl font-extrabold text-white mb-0.5 sm:mb-1">
                   {pricingData ? `Starting ${pricingData.currencySymbol}${creditPackProducts.length > 0 ? Math.min(...creditPackProducts.map(p => p.price_amount)) : pricingData.creditPacks[0]?.price}` : 'Loading...'}
                 </div>
                <div className="mt-0 text-xs sm:text-sm font-semibold text-gray-300">Select your desired amount:</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 sm:px-4 pb-3">
                 <div className="flex flex-col gap-1 sm:gap-2 my-2 sm:my-3 flex-grow">
                   {/* Show database products if available, otherwise show static fallback */}
                    {creditPackProducts.length > 0 ? creditPackProducts.map(pack => <div key={pack.product_id} className="border border-gray-500 rounded-lg p-2 sm:p-2.5 flex justify-between items-center shadow hover:shadow-gray-300/50 transition duration-300 bg-gray-700">
                        <span className="text-white font-medium text-xs sm:text-sm">{pack.credits_amount} credits</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs sm:text-sm">{pricingData?.currencySymbol}{pack.price_amount}</span>
                          <Button size="sm" onClick={() => handleCreditPackClick(pack.product_id)} className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1 h-auto rounded-md" disabled={!isAuthReady || connectionIssue || isCheckoutLoading(pack.product_id)}>
                            {!isAuthReady ? '...' : isCheckoutLoading(pack.product_id) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                          </Button>
                       </div>
                     </div>) :
                // Only show fallback if no database products and not loading
                !isProductsLoading && pricingData?.creditPacks.map(pack => <div key={pack.credits} className="bg-gray-700 border border-gray-500 rounded-lg p-2 sm:p-2.5 flex justify-between items-center shadow hover:shadow-gray-300/50 transition duration-300">
                     <span className="text-white font-medium text-xs sm:text-sm">{pack.credits} credits</span>
                     <div className="flex items-center gap-2">
                       <span className="text-white font-bold text-xs sm:text-sm">{pricingData?.currencySymbol}{pack.price}</span>
                        <Button size="sm" onClick={() => handleCreditPackClick(pack.productId)} className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1 h-auto rounded-md" disabled={!isAuthReady || connectionIssue || isCheckoutLoading(pack.productId)}>
                          {!isAuthReady ? '...' : isCheckoutLoading(pack.productId) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                        </Button>
                     </div>
                   </div>)}
                  
                  {/* Loading state */}
                  {isProductsLoading && <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                      <span className="ml-2 text-white text-xs">Loading credit packs...</span>
                    </div>}
                </div>
                
                {/* Features list */}
                <ul className="space-y-1 mb-2">
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                    <span className="text-white text-[10px] sm:text-xs">No expiration</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                    <span className="text-white text-[10px] sm:text-xs">Instant activation</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                    <span className="text-white text-[10px] sm:text-xs">Secure payment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>;
}