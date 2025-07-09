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
const planGradientBg = {
  free: "bg-black border border-blue-400/30",
  subscription: "bg-gradient-to-br from-[#2563eb] via-[#3893ec] to-[#1872ba] dark:from-[#274299] dark:via-[#3177c7] dark:to-[#1b466c]",
  pack: "bg-black border border-indigo-400/30"
};
const planTextColor = {
  free: "text-blue-100",
  subscription: "text-cyan-100",
  pack: "text-indigo-100"
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
  
  const { userProfile } = useUserProfile();
  
  const {
    pricingData,
    isLoading: isPricingLoading,
    userCountry,
    isShowingCachedData: isShowingCachedPricing
  } = useCachedLocationPricing();
  
  const {
    subscriptionProducts,
    creditPackProducts,
    isLoading: isProductsLoading,
    isShowingCachedData: isShowingCachedProducts
  } = useCachedPaymentProducts(pricingData?.region, pricingData?.currency);
  
  const {
    createCheckoutSession,
    isLoading: isCheckoutLoading
  } = useCheckoutSession();

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
  const handleSubscribeClick = async () => {
    const subscriptionProduct = subscriptionProducts[0];
    if (!subscriptionProduct) {
      toast.error('Subscription product not available');
      return;
    }
    console.log('Subscribing with product:', subscriptionProduct.product_id);
    const session = await createCheckoutSession(subscriptionProduct.product_id);
    if (session?.url) {
      window.open(session.url, '_blank');
    } else {
      toast.error('Failed to create checkout session');
    }
  };
  const handleCreditPackClick = async (productId: string) => {
    console.log('Buying credit pack with product:', productId);
    const session = await createCheckoutSession(productId);
    if (session?.url) {
      window.open(session.url, '_blank');
    } else {
      toast.error('Failed to create checkout session');
    }
  };
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  // Manual refresh function - refreshes entire page for persistent issues
  const handleManualRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Get display data (cached data is already handled in the hooks)
  const currentBalance = credits ? Number(credits.current_balance) : 0;
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
            {connectionIssue && (
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                className="text-xs bg-red-900/20 border-red-400/30 text-red-300 hover:bg-red-800/30"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>
          <p className="text-blue-100 font-inter font-light mb-1 sm:mb-2 animate-fade-in sm:text-base text-left text-sm">Start with free monthly credits and upgrade anytime — either by purchasing flexible credit packs or a monthly subscription. 


For any payment-related queries, feel free to reach out to us at support@aspirely.ai — we're here to help! 💬</p>
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
              lg:grid-cols-3
              items-stretch
              duration-500
            `}>
            {/* Free Plan */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-blue-400/30 min-h-[320px] sm:min-h-[380px]`}>
              <CardHeader className="text-center pb-2 pt-3 sm:pb-4 sm:pt-6 px-3 sm:px-4">
                <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 ${planTextColor.free}`}>Free Plan</CardTitle>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-100 mt-0.5 mb-0.5">Free</div>
                <div className="mt-0 text-xs sm:text-sm font-semibold text-blue-300">30 credits/month</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 sm:px-4 pb-3">
                <ul className="space-y-1 sm:space-y-2 my-2 sm:my-4 flex-grow">
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-100">Access to all features</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-100">30 credits every month</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-100">Auto-renewal</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-100">Perfect for occasional use</span>
                  </li>
                </ul>  
                <div className="mt-auto">
                  <Button className="w-full py-2 sm:py-2.5 bg-blue-500/90 hover:bg-blue-700 text-white rounded-xl font-orbitron text-xs sm:text-sm shadow border-0" disabled>
                    Current Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Subscription */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.subscription} relative transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-cyan-400/30 min-h-[350px] sm:min-h-[420px]`}>
              <div className="absolute -top-3 sm:-top-6 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-orbitron text-xs px-3 sm:px-4 py-0.5 sm:py-1 shadow-xl border-0 tracking-wide">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pb-2 pt-4 sm:pb-4 sm:pt-8 px-3 sm:px-4">
                <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 ${planTextColor.subscription}`}>Monthly Subscription</CardTitle>
                 <div className="text-2xl sm:text-3xl font-extrabold text-cyan-100 mb-0.5 sm:mb-1 mt-0.5">
                   {subscriptionProducts[0] ? <>
                       {pricingData?.currencySymbol}{subscriptionProducts[0].price_amount}
                       <span className="text-xs sm:text-base font-bold align-super">/month</span>
                     </> : <>
                       {pricingData?.currencySymbol}{pricingData?.monthlyPrice}
                       <span className="text-xs sm:text-base font-bold align-super">/month</span>
                     </>}
                 </div>
                 <div className="mt-0 text-xs sm:text-sm font-semibold text-cyan-200">
                   {subscriptionProducts[0] ? `${subscriptionProducts[0].credits_amount} credits/month` : '300 credits/month'}
                 </div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 sm:px-4 pb-3">
                <ul className="space-y-1 sm:space-y-2 my-2 sm:my-4 flex-grow">
                   <li className="flex items-center gap-1 sm:gap-2">
                     <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                     <span className="text-xs sm:text-sm text-cyan-100">
                       {subscriptionProducts[0] ? `${subscriptionProducts[0].credits_amount} credits every month` : '300 credits every month'}
                     </span>
                   </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-cyan-100">Auto-renewal</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-cyan-100">Cancel anytime</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-cyan-100">Best value for regular users</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-cyan-100">Priority support</span>
                  </li>
                </ul>
                 <div className="mt-auto">
                   <Button onClick={handleSubscribeClick} className="w-full py-2 sm:py-2.5 bg-white hover:bg-yellow-100 text-black font-orbitron text-xs rounded-xl shadow border-0 font-bold transition-colors duration-200" disabled={connectionIssue || isPricingLoading || isProductsLoading || subscriptionProducts[0] && isCheckoutLoading(subscriptionProducts[0].product_id)}>
                     {subscriptionProducts[0] && isCheckoutLoading(subscriptionProducts[0].product_id) ? <>
                         <Loader2 className="w-4 h-4 animate-spin mr-2" />
                         Processing...
                       </> : 'Subscribe Now'}
                   </Button>
                 </div>
              </CardContent>
            </Card>

            {/* Credit Packs - Region-specific products only */}
            <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-indigo-400/30 min-h-[320px] sm:min-h-[380px]`}>
              <CardHeader className="text-center pb-2 pt-3 sm:pb-4 sm:pt-6 px-3 sm:px-4">
                <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 ${planTextColor.pack}`}>Credit Packs</CardTitle>
                 <div className="text-2xl sm:text-3xl font-extrabold text-[#badbff] mb-0.5 sm:mb-1">
                   Starting {pricingData?.currencySymbol}{creditPackProducts.length > 0 ? Math.min(...creditPackProducts.map(p => p.price_amount)) : pricingData?.creditPacks[0]?.price}
                 </div>
                <div className="mt-0 text-xs sm:text-sm font-semibold text-indigo-200">Select your desired amount:</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-3 sm:px-4 pb-3">
                 <div className="flex flex-col gap-1 sm:gap-2 my-2 sm:my-3 flex-grow">
                   {/* Show database products if available, otherwise show static fallback */}
                   {creditPackProducts.length > 0 ? creditPackProducts.map(pack => 
                     <div key={pack.product_id} className="bg-gradient-to-r from-[#385494] via-[#3d6dbb] to-[#4478d6] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                       <span className="text-indigo-100 font-medium text-xs sm:text-sm">{pack.credits_amount} credits</span>
                       <div className="flex items-center gap-2">
                         <span className="text-indigo-50 font-bold text-xs sm:text-sm">{pricingData?.currencySymbol}{pack.price_amount}</span>
                         <Button size="sm" onClick={() => handleCreditPackClick(pack.product_id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 h-auto rounded-md" disabled={connectionIssue || isCheckoutLoading(pack.product_id)}>
                           {isCheckoutLoading(pack.product_id) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                         </Button>
                       </div>
                     </div>) :
                 // Only show fallback if no database products and not loading
                 !isProductsLoading && pricingData?.creditPacks.map(pack => 
                   <div key={pack.credits} className="bg-gradient-to-r from-[#385494] via-[#3d6dbb] to-[#4478d6] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                     <span className="text-indigo-100 font-medium text-xs sm:text-sm">{pack.credits} credits</span>
                     <div className="flex items-center gap-2">
                       <span className="text-indigo-50 font-bold text-xs sm:text-sm">{pricingData?.currencySymbol}{pack.price}</span>
                       <Button size="sm" onClick={() => handleCreditPackClick(pack.productId)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 h-auto rounded-md" disabled={connectionIssue || isCheckoutLoading(pack.productId)}>
                         {isCheckoutLoading(pack.productId) ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                       </Button>
                     </div>
                   </div>)}
                  
                  {/* Loading state */}
                  {isProductsLoading && <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                      <span className="ml-2 text-indigo-200 text-xs">Loading credit packs...</span>
                    </div>}
                </div>
                
                {/* Features list */}
                <ul className="space-y-1 mb-2">
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-indigo-100 text-[10px] sm:text-xs">No expiration</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-indigo-100 text-[10px] sm:text-xs">Instant activation</span>
                  </li>
                  <li className="flex items-center gap-1 sm:gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-indigo-100 text-[10px] sm:text-xs">Secure payment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>;
}