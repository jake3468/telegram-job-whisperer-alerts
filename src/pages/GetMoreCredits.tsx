
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
  free: "bg-gradient-to-br from-[#23304a] via-[#264e7c] to-[#20345a] dark:from-[#233363] dark:via-[#162128] dark:to-[#214eb7]",
  subscription: "bg-gradient-to-br from-[#2563eb] via-[#3893ec] to-[#1872ba] dark:from-[#274299] dark:via-[#3177c7] dark:to-[#1b466c]",
  pack: "bg-gradient-to-br from-[#314e8c] via-[#517fd0] to-[#315b8b] dark:from-[#223450] dark:via-[#355a9c] dark:to-[#364e6b]",
};

const planTextColor = {
  free: "text-blue-100",
  subscription: "text-cyan-100",
  pack: "text-indigo-100",
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
      <div className="min-h-[80vh] w-full bg-gradient-to-b from-[#162650] via-[#214072] to-[#2b4f88] px-2 sm:px-0 py-8 flex flex-col">
        <div className="max-w-full mx-auto w-full">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h1 className="text-3xl sm:text-5xl font-orbitron font-extrabold bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent mb-2 drop-shadow tracking-tight animate-fade-in">
              Flexible Pricing for All Users
            </h1>
            <p className="text-base sm:text-lg text-blue-100 font-inter font-light mb-2 animate-fade-in">
              Pay only for what you use. Get started with free monthly credits, and upgrade anytime with our credit packs.
            </p>
            <p className="text-sm sm:text-base text-cyan-200 font-inter animate-fade-in">
              Current Balance: <span className="font-bold text-cyan-100">{Number(credits?.current_balance || 0).toLocaleString()} credits</span>
            </p>
          </div>
        </div>
        <div
          className="
            w-full flex-grow
            flex flex-col
            items-center justify-center
          "
        >
          {/* Plans Grid */}
          <div
            className="
              grid gap-8
              w-full
              px-2
              sm:px-4
              md:px-8
              lg:px-16
              xl:px-24
              2xl:px-40
              mx-auto
              grid-cols-1
              md:grid-cols-3
              items-stretch
              transition-all
              duration-300
              "
            style={{
              maxWidth: '1680px'
            }}
          >
            {/* Free Plan */}
            <Card
              className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.free} transition-all duration-500 ease-[cubic-bezier(.27,.54,.56,1.11)] hover:scale-[1.03] hover:shadow-blue-400/30`}
              style={{
                minHeight: '480px',
              }}
            >
              <CardHeader className="text-center pb-6 pt-7">
                <CardTitle className={`text-2xl font-orbitron font-bold mb-2 ${planTextColor.free}`}>Free Plan</CardTitle>
                <div className="text-4xl font-extrabold text-blue-100 mt-0.5 mb-1.5">Free</div>
                <div className="mt-0 text-base font-semibold text-blue-300">15 credits/month</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-2 sm:px-4">
                <ul className="space-y-3 my-7">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-blue-100">Access to all features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-blue-100">15 credits every month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-blue-100">Auto-renewal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-blue-100">Perfect for occasional use</span>
                  </li>
                </ul>
                <div className="flex-1 flex items-end">
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
            <Card
              className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.subscription} relative transition-all duration-500 ease-[cubic-bezier(.27,.54,.56,1.11)] hover:scale-[1.05] hover:shadow-cyan-400/30`}
              style={{
                minHeight: '520px',
                zIndex: 2,
              }}
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-orbitron text-xs px-5 py-1 shadow-xl border-0 tracking-wide">
                  MOST POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pb-6 pt-10">
                <CardTitle className={`text-2xl font-orbitron font-bold mb-2 ${planTextColor.subscription}`}>Monthly Subscription</CardTitle>
                <div className="text-4xl font-extrabold text-cyan-100 mb-1 mt-0.5">₹199<span className="text-lg font-bold align-super">/month</span></div>
                <div className="mt-0 text-base font-semibold text-cyan-200">200 credits/month</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-2 sm:px-4">
                <ul className="space-y-3 my-7">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-cyan-100">200 credits every month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-cyan-100">Auto-renewal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-cyan-100">Cancel anytime</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-cyan-100">Best value for regular users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-base text-cyan-100">Priority support</span>
                  </li>
                </ul>
                <div className="flex-1 flex items-end">
                  <Button
                    className="w-full py-3 mt-auto bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-700 hover:to-blue-800 text-white font-orbitron text-base rounded-xl shadow border-0"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Credit Packs */}
            <Card
              className={`flex flex-col rounded-2xl shadow-2xl border-0 ${planGradientBg.pack} transition-all duration-500 ease-[cubic-bezier(.27,.54,.56,1.11)] hover:scale-[1.03] hover:shadow-indigo-400/30`}
              style={{
                minHeight: '480px',
              }}
            >
              <CardHeader className="text-center pb-6 pt-7">
                <CardTitle className={`text-2xl font-orbitron font-bold mb-2 ${planTextColor.pack}`}>Credit Packs</CardTitle>
                <div className="text-4xl font-extrabold text-[#badbff] mb-1">₹99</div>
                <div className="mt-0 text-base font-semibold text-indigo-200">Select your desired amount:</div>
              </CardHeader>
              <CardContent className="grow flex flex-col px-2 sm:px-4">
                <div className="flex flex-col gap-3 my-4">
                  <div className="bg-gradient-to-r from-[#385494] via-[#3d6dbb] to-[#4478d6] rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-indigo-400/15 transition duration-300">
                    <span className="text-indigo-100 font-medium text-base">50 credits</span>
                    <span>
                      <span className="text-indigo-50 font-bold mr-3">₹99</span>
                      <span className="text-xs text-indigo-200">₹2 per credit</span>
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#4478d6] rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-indigo-400/15 transition duration-300">
                    <span className="text-indigo-100 font-medium text-base">100 credits</span>
                    <span>
                      <span className="text-indigo-50 font-bold mr-3">₹189</span>
                      <span className="text-xs text-indigo-200">₹1.89 per credit</span>
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#528bfd] rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-indigo-400/15 transition duration-300">
                    <span className="text-indigo-100 font-medium text-base">200 credits</span>
                    <span>
                      <span className="text-indigo-50 font-bold mr-3">₹349</span>
                      <span className="text-xs text-indigo-200">₹1.75 per credit</span>
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-[#385494] via-[#4481db] to-[#789cfb] rounded-lg p-3 border border-indigo-400 flex flex-col sm:flex-row justify-between items-center text-left shadow hover:shadow-indigo-400/15 transition duration-300">
                    <span className="text-indigo-100 font-medium text-base">500 credits</span>
                    <span>
                      <span className="text-indigo-50 font-bold mr-3">₹799</span>
                      <span className="text-xs text-indigo-200">₹1.60 per credit</span>
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
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
                <div className="flex-1 flex items-end">
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
      </div>
    </Layout>
  );
}

// ... end of file ...
