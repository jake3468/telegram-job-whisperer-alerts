
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useUserCredits } from '@/hooks/useUserCredits';

const planGradientBg = {
  free:
    "bg-gradient-to-br from-[#334155] via-[#1e293b] to-[#2d6cdf] dark:from-[#233363] dark:via-[#162128] dark:to-[#214eb7]",
  subscription:
    "bg-gradient-to-br from-[#2c44bd] via-[#338de2] to-[#175cb7] dark:from-[#224179] dark:via-[#2b7ad3] dark:to-[#15316e]",
  pack:
    "bg-gradient-to-br from-[#38366a] via-[#4567b5] to-[#344862] dark:from-[#1b1e3a] dark:via-[#353f6b] dark:to-[#162d50]",
};

const planTextColor = {
  free: "text-[#9fd3fc]",
  subscription: "text-[#90e0ff]",
  pack: "text-[#c9dfff]",
};

const planAccentColor = {
  free: "bg-blue-500",
  subscription: "bg-cyan-400",
  pack: "bg-indigo-400",
};

export default function GetMoreCredits() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { data: credits } = useUserCredits();

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
    <Layout>
      <div className="min-h-[80vh] flex flex-col w-full bg-gradient-to-b from-[#151d33] via-[#19275a] to-[#284275] px-2 sm:px-6 py-6">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-orbitron font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-2 drop-shadow tracking-tight animate-fade-in">
            Flexible Pricing for All Users
          </h1>
          <p className="text-base sm:text-lg text-blue-100 font-inter font-light mb-2 animate-fade-in">
            Pay only for what you use. Get started with free monthly credits, and upgrade anytime with our credit packs.
          </p>
          <p className="text-sm sm:text-base text-cyan-200 font-inter animate-fade-in">
            Current Balance: <span className="font-bold text-cyan-200">{Number(credits?.current_balance || 0).toLocaleString()} credits</span>
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mx-auto w-full max-w-6xl justify-center items-stretch animate-scale-in">
          {/* Free Plan */}
          <Card className={`flex-1 rounded-2xl shadow-xl border-none ${planGradientBg.free} relative flex flex-col transition-transform hover:scale-105`}>
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className={`text-xl sm:text-2xl font-orbitron font-bold mb-2 ${planTextColor.free}`}>Free Plan</CardTitle>
              <div className={`text-3xl sm:text-4xl font-extrabold ${planTextColor.free}`}>Free</div>
              <div className="mt-1 text-sm text-blue-200">15 credits/month</div>
            </CardHeader>
            <CardContent className="grow flex flex-col">
              <ul className="space-y-4 my-6 sm:my-10 px-1 sm:px-0">
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-blue-100">Access to all features</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-blue-100">15 credits every month</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-blue-100">Auto-renewal</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-blue-100">Perfect for occasional use</span>
                </li>
              </ul>
              <div className="flex flex-1 items-end">
                <Button
                  className="w-full py-3 mt-auto bg-blue-500/90 hover:bg-blue-700 text-white rounded-xl font-orbitron text-base shadow border-0"
                  disabled
                >
                  Current Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Subscription */}
          <Card className={`flex-1 rounded-2xl shadow-2xl border-none ${planGradientBg.subscription} relative flex flex-col transition-transform hover:scale-105`}>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-orbitron text-xs px-5 py-1 shadow-xl border-0">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="text-center pb-6 pt-8">
              <CardTitle className={`text-xl sm:text-2xl font-orbitron font-bold mb-2 ${planTextColor.subscription}`}>Monthly Subscription</CardTitle>
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-200 mb-1">₹199<span className="text-lg font-bold align-super">/month</span></div>
              <div className="mt-1 text-sm text-cyan-100">200 credits/month</div>
            </CardHeader>
            <CardContent className="grow flex flex-col">
              <ul className="space-y-4 my-6 sm:my-10 px-1 sm:px-0">
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-cyan-100">200 credits every month</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-cyan-100">Auto-renewal</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-cyan-100">Cancel anytime</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-cyan-100">Best value for regular users</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-sm sm:text-base text-cyan-100">Priority support</span>
                </li>
              </ul>
              <div className="flex flex-1 items-end">
                <Button
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-700 hover:to-blue-800 text-white font-orbitron text-base rounded-xl mt-auto shadow border-0"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packs */}
          <Card className={`flex-1 rounded-2xl shadow-xl border-none ${planGradientBg.pack} flex flex-col transition-transform hover:scale-105`}>
            <CardHeader className="text-center pb-6 pt-6">
              <CardTitle className={`text-xl sm:text-2xl font-orbitron font-bold mb-2 ${planTextColor.pack}`}>Credit Packs</CardTitle>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#8bafff] mb-1">₹99</div>
              <div className="mt-1 text-sm text-indigo-100">Select your desired amount:</div>
            </CardHeader>
            <CardContent className="grow flex flex-col">
              <div className="flex flex-col gap-3 my-6 sm:my-10">
                <div className="bg-indigo-800/40 rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-blue-400/20 transition-colors">
                  <span className="text-indigo-100 font-medium text-base">50 credits</span>
                  <span>
                    <span className="text-indigo-300 font-bold mr-3">₹99</span>
                    <span className="text-xs text-indigo-300">₹2 per credit</span>
                  </span>
                </div>
                <div className="bg-indigo-800/40 rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-blue-400/20 transition-colors">
                  <span className="text-indigo-100 font-medium text-base">100 credits</span>
                  <span>
                    <span className="text-indigo-300 font-bold mr-3">₹189</span>
                    <span className="text-xs text-indigo-300">₹1.89 per credit</span>
                  </span>
                </div>
                <div className="bg-indigo-800/40 rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-blue-400/20 transition-colors">
                  <span className="text-indigo-100 font-medium text-base">200 credits</span>
                  <span>
                    <span className="text-indigo-300 font-bold mr-3">₹349</span>
                    <span className="text-xs text-indigo-300">₹1.75 per credit</span>
                  </span>
                </div>
                <div className="bg-indigo-800/40 rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-blue-400/20 transition-colors">
                  <span className="text-indigo-100 font-medium text-base">500 credits</span>
                  <span>
                    <span className="text-indigo-300 font-bold mr-3">₹799</span>
                    <span className="text-xs text-indigo-300">₹1.60 per credit</span>
                  </span>
                </div>
              </div>
              <ul className="space-y-3 mb-4 px-1 sm:px-0">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-indigo-100 text-sm">No expiration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-indigo-100 text-sm">Instant activation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-indigo-100 text-sm">Secure payment</span>
                </li>
              </ul>
              <div className="flex flex-1 items-end">
                <Button
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-600 hover:from-indigo-600 hover:to-purple-800 text-white font-orbitron text-base rounded-xl mt-auto shadow border-0"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
