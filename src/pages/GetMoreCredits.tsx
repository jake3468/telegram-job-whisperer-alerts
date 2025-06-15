
import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useUserCredits } from '@/hooks/useUserCredits';

const GetMoreCredits = () => {
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
      <div className="flex flex-col w-full bg-transparent">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-orbitron font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-4 drop-shadow tracking-tight">
            Flexible Pricing for All Users
          </h1>
          <p className="text-lg text-blue-100 font-inter font-light mb-2">
            Pay only for what you use. Get started with free monthly credits, and upgrade anytime with our credit packs.
          </p>
          <p className="text-sm text-blue-200 font-inter">
            Current Balance: <span className="font-bold text-cyan-300">{Number(credits?.current_balance || 0).toLocaleString()} credits</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
          {/* Free Plan */}
          <Card className="border-blue-400/20 shadow-2xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40 backdrop-blur-sm relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-orbitron text-blue-100 mb-2">Free Plan</CardTitle>
              <div className="text-4xl font-bold text-blue-300 mb-2">Free</div>
              <p className="text-blue-200">15 credits/month</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-blue-100">Access to all features</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-blue-100">15 credits every month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-blue-100">Auto-renewal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-blue-100">Perfect for occasional use</span>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-orbitron" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Subscription */}
          <Card className="border-cyan-400/30 shadow-2xl bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-orbitron text-xs px-4 py-1">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-orbitron text-cyan-100 mb-2">Monthly Subscription</CardTitle>
              <div className="text-4xl font-bold text-cyan-300 mb-2">₹199/month</div>
              <p className="text-cyan-200">200 credits/month</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-cyan-100">200 credits every month</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-cyan-100">Auto-renewal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-cyan-100">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-cyan-100">Best value for regular users</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-cyan-100">Priority support</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-orbitron">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Credit Packs */}
          <Card className="border-indigo-400/20 shadow-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-orbitron text-indigo-100 mb-2">Credit Packs</CardTitle>
              <div className="text-4xl font-bold text-indigo-300 mb-2">₹99</div>
              <p className="text-indigo-200">Select your desired amount:</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="bg-indigo-800/30 rounded-lg p-3 border border-indigo-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100 font-medium">50 credits</span>
                    <span className="text-indigo-300">₹99</span>
                  </div>
                  <div className="text-xs text-indigo-300 mt-1">₹2 per credit</div>
                </div>
                <div className="bg-indigo-800/30 rounded-lg p-3 border border-indigo-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100 font-medium">100 credits</span>
                    <span className="text-indigo-300">₹189</span>
                  </div>
                  <div className="text-xs text-indigo-300 mt-1">₹1.89 per credit</div>
                </div>
                <div className="bg-indigo-800/30 rounded-lg p-3 border border-indigo-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100 font-medium">200 credits</span>
                    <span className="text-indigo-300">₹349</span>
                  </div>
                  <div className="text-xs text-indigo-300 mt-1">₹1.75 per credit</div>
                </div>
                <div className="bg-indigo-800/30 rounded-lg p-3 border border-indigo-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-100 font-medium">500 credits</span>
                    <span className="text-indigo-300">₹799</span>
                  </div>
                  <div className="text-xs text-indigo-300 mt-1">₹1.60 per credit</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-indigo-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>No expiration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Instant activation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Secure payment</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-orbitron">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default GetMoreCredits;
