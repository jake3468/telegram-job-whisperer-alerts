
import { BellRing, ScanSearch, FileText, Linkedin, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming Card can be used like this
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const tools = [
  {
    icon: BellRing,
    title: "Telegram Job Alerts",
    description: "Get instant job notifications tailored to your profile, directly on Telegram.",
    link: "/job-alerts", // Assuming this is the correct link
    cta: "Set Up Alerts",
  },
  {
    icon: ScanSearch,
    title: "AI Job Analysis",
    description: "Analyze job descriptions against your resume to identify key skills and gaps.",
    link: "/job-guide", // Assuming Job Guide covers Analysis or is a good entry point
    cta: "Analyze Jobs",
  },
  {
    icon: FileText,
    title: "AI Cover Letters",
    description: "Generate personalized cover letters in seconds for any job application.",
    link: "/cover-letter", // Assuming this is the correct link
    cta: "Create Letters",
  },
  {
    icon: Linkedin,
    title: "AI LinkedIn Posts",
    description: "Create engaging LinkedIn posts to boost your professional presence.",
    link: "/linkedin-posts", // Assuming this is the correct link
    cta: "Generate Posts",
  }
];

const ToolsSection = () => {
  const navigate = useNavigate();

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool) => (
            <Card 
              key={tool.title}
              className="bg-slate-800/70 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md hover:border-sky-500/70 transition-all duration-300 flex flex-col"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <tool.icon className="w-7 h-7 text-sky-400" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-white font-inter">{tool.title}</CardTitle>
                </div>
                <CardDescription className="text-gray-300 font-inter font-light text-base leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <Button 
                  onClick={() => navigate(tool.link)}
                  variant="outline"
                  className="w-full mt-auto bg-sky-600/20 hover:bg-sky-500/30 border-sky-500/50 text-sky-300 hover:text-sky-200 font-medium group"
                >
                  {tool.cta}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
