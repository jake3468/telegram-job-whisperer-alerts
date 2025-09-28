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
  return <section className="py-8 md:py-12 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary bg-clip-text mb-2 font-inter text-foreground">Pricing Plans</h2>
          <p className="text-base text-foreground font-inter leading-relaxed mb-4">
            We work on a credit-based pricing system, and each feature uses the following credits:
          </p>
          
          <div className="max-w-2xl mx-auto mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Job Alerts (0.1 credits each)</div>
                  <div className="text-muted-foreground">Personalized job notifications delivered to you</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Cover Letter (1.5 credits)</div>
                  <div className="text-muted-foreground">Personalized, human-tone PDF cover letter</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Resume (3 credits)</div>
                  <div className="text-muted-foreground">Customized PDF resume aligned with job posting</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Interview Prep (6 credits)</div>
                  <div className="text-muted-foreground">20-page PDF with tailored Q&A and strategies</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Job Fit Check (1 credit)</div>
                  <div className="text-muted-foreground">Detailed evaluation with personalized fit score</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Company Insights (3 credits)</div>
                  <div className="text-muted-foreground">Deep insights on company culture and expectations</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Visa Sponsorship Info (2 credits)</div>
                  <div className="text-muted-foreground">PDF guide for visa sponsorship clarity</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-left">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium">Connect with HRs (2 credits)</div>
                  <div className="text-muted-foreground">Direct recruiter profiles + tailored messages</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <div className="grid gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 items-stretch max-w-4xl md:max-w-3xl lg:max-w-4xl mx-auto">
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
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600 mb-3">
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
              <div className="text-3xl font-extrabold text-white mb-1">
                ⚡ Power Pack
              </div>
              <div className="text-sm font-semibold text-gray-300">Get 200 credits instantly</div>
            </CardHeader>
            <CardContent className="grow flex flex-col px-4 pb-4">
              <div className="flex flex-col gap-2 my-1 flex-grow max-w-md mx-auto">
                {/* Show only the 200 credit pack from database products */}
                {creditPackProducts.filter(pack => pack.credits_amount === 200).map(pack => 
                  <div key={pack.product_id} className="rounded-md p-3 border border-gray-500 flex justify-between items-center shadow hover:shadow-md transition duration-300 bg-gray-700">
                    <div className="flex items-center gap-2">
                      {pricingData.region === 'IN' ? (
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
                     <div className="flex items-center gap-3">
                     </div>
                  </div>
                )}
                
                {/* Loading state */}
                {isProductsLoading && <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                    <span className="ml-2 text-indigo-200 text-xs">Loading credit packs...</span>
                  </div>}
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
                      <img 
                        src="/lovable-uploads/e5bac2d4-e5d9-4f9d-accf-c8ac205f690b.png" 
                        alt="Jobs that will vanish by 2030 e-book cover" 
                        className="w-20 h-28 object-contain rounded shadow-md flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <div className="text-cyan-400 font-semibold text-xs mb-1">FREE E-book:</div>
                        <div className="text-white font-medium text-xs mb-2">"Jobs that will vanish by 2030: 8 Strategies to Save Your Career Before AI Takes Over"</div>
                        <div className="text-gray-300 text-xs leading-relaxed">
                          Purchase any of the credit packs above and get a downloadable link sent via email.
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Instant access, read on any device, keep forever
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              
              {/* Buy Button */}
              <div className="mt-auto flex justify-center">
                {creditPackProducts.filter(pack => pack.credits_amount === 200).map(pack => (
                  <SignUpButton key={pack.product_id} mode="modal">
                    <Button className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 rounded-full flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Buy {pack.credits_amount} Credits - {pricingData.currencySymbol}{pack.price_amount}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </SignUpButton>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default PricingSection;