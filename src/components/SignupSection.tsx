
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
    <section id="signup-section" className="py-20 px-4 bg-gradient-to-br from-sky-950 via-black to-indigo-950 min-h-[480px]">
      <div className="max-w-md mx-auto">
        <div className="p-1 rounded-3xl bg-gradient-to-tr from-sky-400 via-fuchsia-400/40 to-indigo-400 shadow-2xl">
          <div className="bg-black/85 border border-slate-700 rounded-[1.3rem] p-8 shadow-2xl backdrop-blur-md relative">
            <div className="absolute -right-3 -top-3 w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-sky-500/10 rounded-full blur-xl opacity-60 pointer-events-none"></div>
            <div className="absolute left-0 bottom-0 w-28 h-14 bg-gradient-to-r from-indigo-700/30 via-fuchsia-500/20 to-sky-400/30 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-white mb-2 font-inter drop-shadow-xl bg-gradient-to-r from-sky-300 via-fuchsia-300 to-yellow-200 bg-clip-text text-transparent">
                Ready to Get Started?
              </h2>
              <p className="text-gray-200 font-inter font-medium text-base drop-shadow font-playfair">
                Create your account and <span className="bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-sky-300 text-transparent bg-clip-text font-semibold">let JobBots assist your job search.</span>
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-200 font-inter font-semibold tracking-wide">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-2 bg-slate-700/80 border-sky-500 shadow-lg shadow-sky-400/20 text-white placeholder:text-slate-300 font-inter h-12 text-base focus:border-fuchsia-500 focus:ring-fuchsia-500 transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-500 hover:from-sky-500 hover:to-fuchsia-600 text-white py-3 rounded-xl font-inter font-bold transition-all duration-200 h-12 text-base shadow-lg shadow-fuchsia-400/30 relative focus:outline-none focus:ring-4 focus:ring-fuchsia-400/60 drop-shadow hover:brightness-105 hover:scale-[1.03]"
                style={{
                  boxShadow: "0 4px 24px 0 rgba(126, 34, 206, 0.13), 0 0px 0px 2px #a5b4fc",
                }}
              >
                {loading ? "Creating Account..." : "Create Free Account"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-6 font-inter">
              By signing up, you agree to our{" "}
              <span className="text-sky-300 underline underline-offset-2 cursor-pointer">Terms of Service</span> and{" "}
              <span className="text-sky-300 underline underline-offset-2 cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupSection;
