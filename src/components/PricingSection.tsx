import { SignUpButton } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Loader2 } from 'lucide-react';
import { useLocationPricing } from '@/hooks/useLocationPricing';
import { usePaymentProducts } from '@/hooks/usePaymentProducts';
const planGradientBg = {
  free: "bg-white border border-gray-200",
  subscription: "bg-gradient-to-br from-[#2563eb] via-[#3893ec] to-[#1872ba] dark:from-[#274299] dark:via-[#3177c7] dark:to-[#1b466c]",
  pack: "bg-white border border-gray-200"
};
const planTextColor = {
  free: "text-gray-800",
  subscription: "text-cyan-100",
  pack: "text-gray-800"
};
const PricingSection = () => {
  const {
    pricingData,
    isLoading: isPricingLoading,
    userCountry
  } = useLocationPricing();
  const {
    subscriptionProducts,
    creditPackProducts,
    isLoading: isProductsLoading
  } = usePaymentProducts();

  // Prevent rendering if pricing data is not available
  if (!pricingData) {
    return <section className="py-16 sm:py-24 px-4 bg-dark-custom">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-blue-200">Loading pricing...</span>
          </div>
        </div>
      </section>;
  }
  return <section className="py-8 md:py-12 px-4 bg-dark-custom">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent mb-2 font-inter">Pricing Plans</h2>
          <p className="text-lg text-blue-100 font-inter font-light mb-6">
            Pay only for what you use. Get started with free monthly credits, and upgrade anytime.
          </p>
          
          {/* Payment Partner Information */}
          <div className="flex items-center gap-2 text-sm text-blue-200 mb-8 justify-center">
            <span>Powered by</span>
            <span className="ml-1 font-semibold text-blue-100">Dodo Payments</span>
          </div>
        </div>

        <div className="grid gap-8 lg:gap-8 grid-cols-1 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-blue-400/30 min-h-[420px]`}>
            <CardHeader className="text-center pb-4 pt-6 px-4">
              <CardTitle className={`text-xl font-bold mb-2 ${planTextColor.free} font-inter`}>Free Plan</CardTitle>
              <div className="text-3xl font-extrabold text-gray-900 mb-1">Free</div>
              <div className="text-sm font-semibold text-gray-600">30 credits/month</div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-4 pb-4">
              <ul className="space-y-2 my-4 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Access to all features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">30 credits every month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Auto-renewal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Perfect for occasional use</span>
                </li>
              </ul>
              <div className="mt-auto">
                <SignUpButton mode="modal">
                  <Button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-inter text-sm shadow border-0 font-semibold">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Subscription */}
          <Card className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.subscription} relative transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-cyan-400/30 min-h-[460px] mt-8 lg:mt-0`}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-inter text-xs px-4 py-1 shadow-xl border-0 tracking-wide font-semibold">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="text-center pb-4 pt-8 px-4">
              <CardTitle className={`text-xl font-bold mb-2 ${planTextColor.subscription} font-inter`}>Monthly Subscription</CardTitle>
              <div className="text-3xl font-extrabold text-cyan-100 mb-1">
                {subscriptionProducts[0] ? <>
                    {pricingData.currencySymbol}{subscriptionProducts[0].price_amount}
                    <span className="text-base font-bold align-super">/month</span>
                  </> : <>
                    {pricingData.currencySymbol}{pricingData.monthlyPrice}
                    <span className="text-base font-bold align-super">/month</span>
                  </>}
              </div>
              <div className="text-sm font-semibold text-cyan-200">
                {subscriptionProducts[0] ? `${subscriptionProducts[0].credits_amount} credits/month` : '300 credits/month'}
              </div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-4 pb-4">
              <ul className="space-y-2 my-4 flex-grow">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-cyan-100">
                    {subscriptionProducts[0] ? `${subscriptionProducts[0].credits_amount} credits every month` : '300 credits every month'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-cyan-100">Auto-renewal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-cyan-100">Cancel anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-cyan-100">Best value for regular users</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-cyan-100">Priority support</span>
                </li>
              </ul>
              <div className="mt-auto">
                <SignUpButton mode="modal">
                  <Button className="w-full py-2.5 bg-white hover:bg-yellow-100 text-black font-inter text-sm rounded-xl shadow border-0 font-bold transition-colors duration-200" disabled={isPricingLoading || isProductsLoading}>
                    {isPricingLoading || isProductsLoading ? <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </> : 'Subscribe Now'}
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packs */}
          <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-indigo-400/30 min-h-[420px]`}>
            <CardHeader className="text-center pb-4 pt-6 px-4">
              <CardTitle className={`text-xl font-bold mb-2 ${planTextColor.pack} font-inter`}>Credit Packs</CardTitle>
              <div className="text-3xl font-extrabold text-gray-900 mb-1">
                Starting {pricingData.currencySymbol}{creditPackProducts.length > 0 ? Math.min(...creditPackProducts.map(p => p.price_amount)) : pricingData.creditPacks[0]?.price}
              </div>
              <div className="text-sm font-semibold text-gray-600">Select your desired amount:</div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-4 pb-4">
              <div className="flex flex-col gap-2 my-3 flex-grow">
                {/* Show database products if available, otherwise show static fallback */}
                {creditPackProducts.length > 0 ? creditPackProducts.map(pack => <div key={pack.product_id} className="rounded-lg p-2.5 border border-gray-200 flex justify-between items-center shadow hover:shadow-md transition duration-300 bg-blue-100">
                      <span className="text-gray-800 font-medium text-sm">{pack.credits_amount} credits</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-bold text-sm">{pricingData.currencySymbol}{pack.price_amount}</span>
                        <SignUpButton mode="modal">
                          <Button size="sm" className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1 h-auto rounded-md">
                            Buy
                          </Button>
                        </SignUpButton>
                      </div>
                    </div>) :
              // Only show fallback if no database products and not loading
              !isProductsLoading && pricingData.creditPacks.map(pack => <div key={pack.credits} className="bg-gray-100 rounded-lg p-2.5 border border-gray-200 flex justify-between items-center shadow hover:shadow-md transition duration-300">
                      <span className="text-gray-800 font-medium text-sm">{pack.credits} credits</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-bold text-sm">{pricingData.currencySymbol}{pack.price}</span>
                        <SignUpButton mode="modal">
                          <Button size="sm" className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1 h-auto rounded-md">
                            Buy
                          </Button>
                        </SignUpButton>
                      </div>
                    </div>)}
                
                {/* Loading state */}
                {isProductsLoading && <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                    <span className="ml-2 text-indigo-200 text-xs">Loading credit packs...</span>
                  </div>}
              </div>
              
              {/* Features list */}
              <ul className="space-y-1 mb-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">No expiration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Instant activation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Secure payment</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default PricingSection;