
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SignupSection = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Account Created!",
        description: "Check your email for next steps to complete your setup.",
      });
      setLoading(false);
      setEmail("");
    }, 1500);
  };

  return (
    <section id="signup-section" className="bg-black py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-white mb-2 font-inter">
              Ready to Get Started?
            </h2>
            <p className="text-gray-300 font-inter font-light">
              Create your account and let Jobbots assist your job search.
            </p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-200 font-inter font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-2 bg-slate-700/80 border-slate-600 text-white placeholder:text-slate-400 font-inter h-12 text-base focus:border-sky-500 focus:ring-sky-500"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg font-inter font-medium transition-all duration-200 h-12 text-base shadow-md hover:shadow-sky-500/30"
            >
              {loading ? "Creating Account..." : "Create Free Account"}
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-6 font-inter">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignupSection;
