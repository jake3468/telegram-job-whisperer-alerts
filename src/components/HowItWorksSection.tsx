
import { Upload, Settings, MessageCircle, FileText } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Resume",
      description: "Upload your resume and tell us about your experience and preferences.",
      bgColor: "bg-pastel-blue",
      delay: "0ms"
    },
    {
      icon: Settings,
      title: "Set Preferences", 
      description: "Choose your desired job types, locations, and how often you want alerts.",
      bgColor: "bg-pastel-mint",
      delay: "200ms"
    },
    {
      icon: MessageCircle,
      title: "Connect Telegram",
      description: "Link your Telegram account to receive personalized job alerts.",
      bgColor: "bg-pastel-peach", 
      delay: "400ms"
    },
    {
      icon: FileText,
      title: "Get Matched Jobs",
      description: "Receive job alerts with custom resumes and cover letters for each opportunity.",
      bgColor: "bg-pastel-lavender",
      delay: "600ms"
    }
  ];

  return (
    <section className="bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 font-inter font-light">
            Four simple steps to revolutionize your job search
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`${step.bgColor} rounded-2xl p-8 text-black shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-float`}
              style={{ animationDelay: step.delay }}
            >
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mb-6">
                <step.icon className="w-6 h-6 text-black" />
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
