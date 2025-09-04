import { SignUpButton } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Loader2, ArrowRight } from 'lucide-react';
import { useLocationPricing } from '@/hooks/useLocationPricing';
import { usePaymentProducts } from '@/hooks/usePaymentProducts';
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
const PricingSection = () => {
  const {
    pricingData,
    isLoading: isPricingLoading,
    userCountry
  } = useLocationPricing();
  const {
    creditPackProducts,
    isLoading: isProductsLoading
  } = usePaymentProducts();

  // Prevent rendering if pricing data is not available
  if (!pricingData) {
    return <section className="py-16 sm:py-24 px-4 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-blue-200">Loading pricing...</span>
          </div>
        </div>
      </section>;
  }
  return <section className="py-8 md:py-12 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text mb-2 font-inter text-gray-50">Pricing Plans</h2>
          <p className="text-lg text-blue-100 font-inter font-light mb-6">
            Start with 10 free monthly credits and upgrade anytime with flexible credit packs.
          </p>
          
          {/* Payment Partner Information */}
          <div className="flex items-center gap-2 text-sm text-blue-200 mb-8 justify-center">
            <span>Powered by</span>
            <span className="ml-1 font-semibold text-blue-100">Dodo Payments</span>
          </div>
        </div>

        <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 items-stretch max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-blue-400/30 min-h-[320px]`}>
            <CardHeader className="text-center pb-2 pt-4 px-3">
              <div className="inline-block px-3 py-1 bg-cyan-400 text-gray-800 text-sm font-bold rounded-full mb-2">
                Free Plan
              </div>
              <div className="text-2xl font-extrabold text-white mb-1">Free</div>
              <div className="text-sm font-semibold text-gray-300">10 credits/month</div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-3 pb-3">
              <div className="text-left my-3 flex-grow px-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-sm text-white">Access to all features</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-sm text-white">10 credits every month (auto-renewal)</span>
                </div>
                
                <div className="text-sm font-semibold text-cyan-300 mb-2">Use credits on any feature you want:</div>
                <div className="text-xs text-white space-y-1 ml-4 mb-3">
                  <div>Resume = 3 credits</div>
                  <div>Cover Letter = 1.5 credits</div>
                  <div>Interview Prep = 6 credits</div>
                  <div>Job Fit Check = 1 credit</div>
                  <div>Company Insights = 3 credits</div>
                  <div>Visa Info = 2 credits</div>
                  <div>HR Profile = 2 credits</div>
                </div>

                <div className="text-xs text-gray-300 bg-gray-800/30 p-2 rounded border-l-2 border-cyan-400/40 mb-3">
                  <strong>Example:</strong> With 10 credits, you could create 3 Cover Letters + 1 Resume + 2 Job Fit Checks, or run 10 Job Fit Checks - your choice.
                </div>

                <div className="text-sm font-semibold text-cyan-300 mb-2">Plus:</div>
                <div className="text-xs text-white space-y-1 ml-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2 h-2 text-black" />
                    </div>
                    <span>Up to 100 Job Alert messages included every month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2 h-2 text-black" />
                    </div>
                    <span>2 free phone-call AI mock interviews</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto flex justify-center">
                <SignUpButton mode="modal">
                  <Button className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packs */}
          <Card className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-indigo-400/30 min-h-[420px]`}>
            <CardHeader className="text-center pb-4 pt-6 px-4">
              <div className="inline-block px-3 py-1 bg-cyan-400 text-gray-800 text-sm font-bold rounded-full mb-2">
                Pay-as-you-go
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                Starting {pricingData.currencySymbol}{creditPackProducts.length > 0 ? Math.min(...creditPackProducts.map(p => p.price_amount)) : pricingData.creditPacks[0]?.price}
              </div>
              <div className="text-sm font-semibold text-gray-300">Select your desired amount:</div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-4 pb-4">
              <div className="flex flex-col gap-2 my-3 flex-grow">
                {/* Show database products if available, otherwise show static fallback */}
                {creditPackProducts.length > 0 ? creditPackProducts.map(pack => <div key={pack.product_id} className="rounded-lg p-2.5 border border-gray-500 flex justify-between items-center shadow hover:shadow-md transition duration-300 bg-gray-700">
                      <span className="text-white font-medium text-sm">{pack.credits_amount} credits</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{pricingData.currencySymbol}{pack.price_amount}</span>
                        <SignUpButton mode="modal">
                          <Button size="sm" className="bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs px-3 py-1 h-auto rounded-md">
                            Buy
                          </Button>
                        </SignUpButton>
                      </div>
                    </div>) :
              // Only show fallback if no database products and not loading
              !isProductsLoading && pricingData.creditPacks.map(pack => <div key={pack.credits} className="bg-gray-700 rounded-lg p-2.5 border border-gray-500 flex justify-between items-center shadow hover:shadow-md transition duration-300">
                      <span className="text-white font-medium text-sm">{pack.credits} credits</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{pricingData.currencySymbol}{pack.price}</span>
                        <SignUpButton mode="modal">
                          <Button size="sm" className="bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs px-3 py-1 h-auto rounded-md">
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
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-white text-xs">No expiration</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-white text-xs">Instant activation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                  <span className="text-white text-xs">Secure payment</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default PricingSection;