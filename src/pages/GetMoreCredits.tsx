import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useUserProfile } from '@/hooks/useUserProfile';

const planGradientBg = {
  free: "bg-black border border-blue-400/30",
  subscription: "bg-gradient-to-br from-[#2563eb] via-[#3893ec] to-[#1872ba] dark:from-[#274299] dark:via-[#3177c7] dark:to-[#1b466c]",
  pack: "bg-black border border-indigo-400/30",
};

const planTextColor = {
  free: "text-blue-100",
  subscription: "text-cyan-100",
  pack: "text-indigo-100",
};

export default function GetMoreCredits() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { data: credits, isLoading, error } = useUserCredits();
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  console.log('[GetMoreCredits] Render - credits:', credits, 'isLoading:', isLoading, 'error:', error);
  console.log('[GetMoreCredits] UserProfile:', userProfile, 'userProfileLoading:', userProfileLoading);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-900/90 via-fuchsia-900/90 to-indigo-900/85 backdrop-blur-2xl shadow-2xl border-b border-fuchsia-400/30">
        <div className="flex items-center justify-between p-3">
          <SidebarTrigger className="h-12 w-12 bg-white/10 border-fuchsia-400/30 ring-2 ring-fuchsia-400/10 text-fuchsia-200 rounded-2xl shadow-lg hover:bg-fuchsia-700/30 transition-all flex items-center justify-center">
            <Menu className="w-7 h-7" strokeWidth={2.4} />
            <span className="sr-only">Toggle navigation menu</span>
          </SidebarTrigger>
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/6239b4a7-4f3c-4902-a936-4216ae26d9af.png"
              alt="JobBots Logo"
              className="h-8 w-8 drop-shadow-lg"
            />
            <span className="font-orbitron font-extrabold text-2xl bg-gradient-to-r from-sky-300 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm tracking-wider select-none relative whitespace-nowrap">
              JobBots
            </span>
          </div>
        </div>
      </header>
      <div
        className={`
          min-h-screen flex w-full 
          bg-gradient-to-br from-[#0e1122] via-[#181526] to-[#21203a]
        `}
        style={{
          margin: 0,
          padding: 0,
          boxShadow: "none",
        }}
      >
        <AppSidebar />
        {/* Main content area with extra spacing for mobile */}
        <div className="flex-1 flex flex-col bg-transparent pt-28 lg:pt-0 lg:pl-20">
          <main className="flex-1 w-full bg-transparent">
            <div className="min-h-[80vh] w-full bg-gradient-to-b from-[#162650] via-[#214072] to-[#2b4f88] py-5 sm:py-8 flex flex-col">
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
                <div className="text-center mb-5 sm:mb-12">
                  <h1 className="text-2xl xs:text-3xl sm:text-5xl font-orbitron font-extrabold bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent mb-1 sm:mb-2 drop-shadow tracking-tight animate-fade-in">
                    Flexible Pricing for All Users
                  </h1>
                  <p className="text-sm sm:text-lg text-blue-100 font-inter font-light mb-1 sm:mb-2 animate-fade-in">
                    Pay only for what you use. Get started with free monthly credits, and upgrade anytime with our credit packs.
                  </p>
                  <p className="text-xs sm:text-base text-cyan-200 font-inter animate-fade-in">
                    Current Balance:{" "}
                    {isLoading || userProfileLoading ? (
                      <span className="font-bold text-cyan-100">Loading...</span>
                    ) : error ? (
                      <span className="font-bold text-rose-300">Error loading</span>
                    ) : credits ? (
                      <>
                        <span className="font-bold text-cyan-100">
                          {Number(credits.current_balance).toLocaleString()} credits
                        </span>
                        <span className="ml-2 text-[10px] text-blue-200 font-mono">
                          Debug user_profile_id: {credits.user_profile_id}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-yellow-300">No credits found</span>
                        {userProfile?.id && (
                          <span className="ml-2 text-[10px] text-blue-200 font-mono">
                            Profile ID: {userProfile.id}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Responsive grid area with tighter spacing for mobile */}
              <div className="w-full max-w-6xl mx-auto flex-grow flex flex-col items-center justify-center px-2 sm:px-4">
                <div
                  className={`
                    grid gap-3 sm:gap-4 
                    w-full
                    grid-cols-1
                    lg:grid-cols-3
                    items-stretch
                    duration-500
                  `}
                >
                  {/* Free Plan */}
                  <Card
                    className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.free} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-blue-400/30 min-h-[340px] sm:min-h-[420px]`}
                  >
                    <CardHeader className="text-center pb-3 pt-4 sm:pb-4 sm:pt-6 px-2 sm:px-4">
                      <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 sm:mb-2 ${planTextColor.free}`}>Free Plan</CardTitle>
                      <div className="text-2xl sm:text-3xl font-extrabold text-blue-100 mt-0.5 mb-0.5">Free</div>
                      <div className="mt-0 text-xs sm:text-sm font-semibold text-blue-300">15 credits/month</div>
                    </CardHeader>
                    <CardContent className="grow flex flex-col px-2 sm:px-4 pb-3">
                      <ul className="space-y-1.5 sm:space-y-2 my-2 sm:my-4 flex-grow">
                        <li className="flex items-center gap-1 sm:gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-blue-100">Access to all features</span>
                        </li>
                        <li className="flex items-center gap-1 sm:gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-blue-100">15 credits every month</span>
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
                        <Button
                          className="w-full py-2 sm:py-2.5 bg-blue-500/90 hover:bg-blue-700 text-white rounded-xl font-orbitron text-xs sm:text-sm shadow border-0"
                          disabled
                        >
                          Current Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Subscription */}
                  <Card
                    className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.subscription} relative transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-cyan-400/30 min-h-[370px] sm:min-h-[460px]`}
                  >
                    <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-orbitron text-xs px-3 sm:px-4 py-0.5 sm:py-1 shadow-xl border-0 tracking-wide">
                        MOST POPULAR
                      </Badge>
                    </div>
                    <CardHeader className="text-center pb-3 pt-5 sm:pb-4 sm:pt-8 px-2 sm:px-4">
                      <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 sm:mb-2 ${planTextColor.subscription}`}>Monthly Subscription</CardTitle>
                      <div className="text-2xl sm:text-3xl font-extrabold text-cyan-100 mb-0.5 sm:mb-1 mt-0.5">₹199<span className="text-xs sm:text-base font-bold align-super">/month</span></div>
                      <div className="mt-0 text-xs sm:text-sm font-semibold text-cyan-200">200 credits/month</div>
                    </CardHeader>
                    <CardContent className="grow flex flex-col px-2 sm:px-4 pb-3">
                      <ul className="space-y-1.5 sm:space-y-2 my-2 sm:my-4 flex-grow">
                        <li className="flex items-center gap-1 sm:gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-cyan-100">200 credits every month</span>
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
                        <Button
                          className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-700 hover:to-blue-800 text-white font-orbitron text-xs sm:text-sm rounded-xl shadow border-0"
                          disabled
                        >
                          Coming Soon
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credit Packs */}
                  <Card
                    className={`flex flex-col rounded-2xl shadow-2xl ${planGradientBg.pack} transition-transform duration-500 ease-out hover:scale-[1.01] hover:shadow-indigo-400/30 min-h-[340px] sm:min-h-[420px]`}
                  >
                    <CardHeader className="text-center pb-3 pt-4 sm:pb-4 sm:pt-6 px-2 sm:px-4">
                      <CardTitle className={`text-lg sm:text-xl font-orbitron font-bold mb-1 sm:mb-2 ${planTextColor.pack}`}>Credit Packs</CardTitle>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[#badbff] mb-0.5 sm:mb-1">₹99</div>
                      <div className="mt-0 text-xs sm:text-sm font-semibold text-indigo-200">Select your desired amount:</div>
                    </CardHeader>
                    <CardContent className="grow flex flex-col px-2 sm:px-4 pb-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2 my-2 sm:my-3 flex-grow">
                        {/* Each credit pack card is now more compact */}
                        <div className="bg-gradient-to-r from-[#385494] via-[#3d6dbb] to-[#4478d6] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                          <span className="text-indigo-100 font-medium text-xs sm:text-sm">50 credits</span>
                          <div className="text-right">
                            <span className="text-indigo-50 font-bold text-xs sm:text-sm">₹99</span>
                            <div className="text-[10px] sm:text-xs text-indigo-200">₹2/credit</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#4478d6] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                          <span className="text-indigo-100 font-medium text-xs sm:text-sm">100 credits</span>
                          <div className="text-right">
                            <span className="text-indigo-50 font-bold text-xs sm:text-sm">₹189</span>
                            <div className="text-[10px] sm:text-xs text-indigo-200">₹1.89/credit</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#528bfd] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                          <span className="text-indigo-100 font-medium text-xs sm:text-sm">200 credits</span>
                          <div className="text-right">
                            <span className="text-indigo-50 font-bold text-xs sm:text-sm">₹349</span>
                            <div className="text-[10px] sm:text-xs text-indigo-200">₹1.75/credit</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#789cfb] rounded-lg p-2 sm:p-2.5 border border-indigo-400 flex justify-between items-center shadow hover:shadow-indigo-400/15 transition duration-300">
                          <span className="text-indigo-100 font-medium text-xs sm:text-sm">500 credits</span>
                          <div className="text-right">
                            <span className="text-indigo-50 font-bold text-xs sm:text-sm">₹799</span>
                            <div className="text-[10px] sm:text-xs text-indigo-200">₹1.60/credit</div>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-3">
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
                      <div className="mt-auto">
                        <Button
                          className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-600 hover:from-indigo-600 hover:to-purple-800 text-white font-orbitron text-xs sm:text-sm rounded-xl shadow border-0"
                          disabled
                        >
                          Coming Soon
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
