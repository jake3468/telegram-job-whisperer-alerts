
import { BellRing, ScanSearch, FileText, Linkedin, LayoutDashboard, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/clerk-react";

const tools = [
  {
    icon: BellRing,
    title: "Telegram Job Alerts",
    description: "Get instant job notifications tailored to your profile, directly on Telegram.",
    color: "bg-pastel-blue/90 hover:bg-pastel-blue/90",
    button: "Set Up Alerts",
    cardColor: "bg-pastel-blue/20 border-pastel-blue",
    iconColor: "text-blue-500",
  },
  {
    icon: ScanSearch,
    title: "AI Job Analysis",
    description: "Analyze job descriptions against your resume to identify key skills and gaps.",
    color: "bg-pastel-mint/90 hover:bg-pastel-mint/90",
    button: "Analyze Jobs",
    cardColor: "bg-pastel-mint/20 border-pastel-mint",
    iconColor: "text-green-500",
  },
  {
    icon: FileText,
    title: "AI Cover Letters",
    description: "Generate personalized cover letters in seconds for any job application.",
    color: "bg-pastel-peach/90 hover:bg-pastel-peach/90",
    button: "Create Letters",
    cardColor: "bg-pastel-peach/20 border-pastel-peach",
    iconColor: "text-orange-400",
  },
  {
    icon: Linkedin,
    title: "AI LinkedIn Posts",
    description: "Create engaging LinkedIn posts to boost your professional presence.",
    color: "bg-pastel-lavender/90 hover:bg-pastel-lavender/90",
    button: "Generate Posts",
    cardColor: "bg-pastel-lavender/20 border-pastel-lavender",
    iconColor: "text-purple-400",
  },
  {
    icon: LayoutDashboard,
    title: "AI Interview Prep",
    description: "Know the Company. Nail the Interview. Ask Like a Pro.",
    color: "bg-sky-700/90 hover:bg-sky-700/90",
    button: "Start Prep",
    cardColor: "bg-sky-800/40 border-sky-600",
    iconColor: "text-sky-300",
  }
];

const ToolsSection = () => {
  return (
    <section className="bg-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            Unlock Your Career Potential
          </h2>
          <p className="text-xl text-gray-400 font-inter font-light">
            Explore our AI-powered tools designed to streamline your job search.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card 
              key={tool.title}
              className={`${tool.cardColor} border-2 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col min-h-[270px]`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-lg bg-black/30 ${tool.iconColor} flex items-center justify-center`}>
                    <tool.icon className={`w-7 h-7 ${tool.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-white font-inter">{tool.title}</CardTitle>
                </div>
                <CardDescription className="text-gray-300 font-inter font-light text-base leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <SignUpButton mode="modal">
                  <Button 
                    type="button"
                    variant="outline"
                    className={`w-full mt-auto ${tool.color} text-white border-0 shadow-md font-medium group text-base py-3`}
                  >
                    {tool.button}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;

