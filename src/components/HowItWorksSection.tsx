
import { UserPlus, Upload, Sparkles, Rocket } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Create your free account in seconds. No credit card required to get started.",
    },
    {
      icon: Upload,
      title: "Upload Resume", 
      description: "Share your current resume and tell us about your career goals and preferences.",
    },
    {
      icon: Sparkles,
      title: "AI Analysis",
      description: "We use your profile to give you personalized results through our AI-powered tools",
    },
    {
      icon: Rocket,
      title: "Get Results",
      description: "Access all features instantly - from job alerts to cover letters to interview prep.",
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
        
        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500/20 via-blue-500/40 to-indigo-500/20"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step number and icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:shadow-xl group-hover:shadow-sky-500/30 transition-all duration-300 group-hover:scale-105">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-white font-inter">
                  {step.title}
                </h3>
                
                <p className="text-gray-300 font-inter font-light leading-relaxed text-lg max-w-xs">
                  {step.description}
                </p>

                {/* Connector arrow for mobile/tablet */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden mt-8 mb-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-sky-500/40 to-transparent mx-auto"></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full mx-auto transform rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="text-center mt-16">
            <p className="text-gray-400 text-lg mb-6 font-inter">
              Ready to transform your job search?
            </p>
            <div className="inline-flex items-center gap-2 text-sky-400 font-inter font-medium">
              <span>Start your journey</span>
              <Rocket className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
