
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
        <div className="bg-pastel-blue rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-black mb-2 font-inter">
              Get Started
            </h2>
            <p className="text-black/80 font-inter font-light">
              Create your account to start receiving personalized job alerts
            </p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-black font-inter font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-2 bg-white/50 border-black/20 text-black placeholder:text-black/60 font-inter"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-black/80 py-3 rounded-xl font-inter font-medium transition-all duration-200"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <p className="text-xs text-black/60 text-center mt-4 font-inter">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignupSection;
