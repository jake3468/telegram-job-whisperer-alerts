
import { UserPlus, Upload, Sparkles, Rocket } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Create your free account in seconds. No credit card required to get started.",
      bgColor: "bg-pastel-blue",
    },
    {
      icon: Upload,
      title: "Upload Resume", 
      description: "Share your current resume and tell us about your career goals and preferences.",
      bgColor: "bg-pastel-mint",
    },
    {
      icon: Sparkles,
      title: "AI Analysis",
      description: "Our AI analyzes your profile and creates personalized tools for your job search.",
      bgColor: "bg-pastel-peach", 
    },
    {
      icon: Rocket,
      title: "Get Results",
      description: "Access all features instantly - from job alerts to cover letters to interview prep.",
      bgColor: "bg-pastel-lavender",
    }
  ];

  return (
    <section id="how-it-works" className="bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 font-inter font-light">
            Get started in minutes. It's that simple.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`${step.bgColor} rounded-2xl p-8 text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative`}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              
              <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <step.icon className="w-8 h-8 text-black" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3 font-inter">
                {step.title}
              </h3>
              
              <p className="text-black/80 font-inter font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
