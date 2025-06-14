
import { BellRing, ScanSearch, FileText, Linkedin, LayoutDashboard, ArrowRight } from "lucide-react";
import { SignUpButton } from "@clerk/clerk-react";

// Define background and button colors for visual clarity and contrast
const tools = [
  {
    icon: BellRing,
    title: "Telegram Job Alerts",
    description: "Get instant job notifications tailored to your profile, directly on Telegram.",
    cardBg: "bg-[#B8C5FF]", // pastel blue
    buttonBg: "bg-[#5D6DFF] hover:bg-[#4652cc]",
    buttonText: "text-white",
    iconColor: "text-blue-700 bg-white",
  },
  {
    icon: ScanSearch,
    title: "AI Job Analysis",
    description: "Analyze job descriptions against your resume to identify key skills and gaps.",
    cardBg: "bg-[#A5FBCB]", // pastel mint
    buttonBg: "bg-[#16b15b] hover:bg-[#108944]",
    buttonText: "text-white",
    iconColor: "text-green-700 bg-white",
  },
  {
    icon: FileText,
    title: "AI Cover Letters",
    description: "Generate personalized cover letters in seconds for any job application.",
    cardBg: "bg-[#FFD2B5]", // pastel peach
    buttonBg: "bg-[#FF8A3C] hover:bg-[#cc6c30]",
    buttonText: "text-white",
    iconColor: "text-orange-600 bg-white",
  },
  {
    icon: Linkedin,
    title: "AI LinkedIn Posts",
    description: "Create engaging LinkedIn posts to boost your professional presence.",
    cardBg: "bg-[#E5D4FF]", // pastel lavender
    buttonBg: "bg-[#BF92F7] hover:bg-[#9e78c5]",
    buttonText: "text-black",
    iconColor: "text-purple-600 bg-white",
  },
  {
    icon: LayoutDashboard,
    title: "AI Interview Prep",
    description: "Know the Company. Nail the Interview. Ask Like a Pro.",
    cardBg: "bg-[#aee4fa]", // light sky blue
    buttonBg: "bg-[#1e9cd7] hover:bg-[#156d99]",
    buttonText: "text-white",
    iconColor: "text-sky-800 bg-white",
  },
];

const ToolsSection = () => {
  return (
    <section className="bg-black py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            Unlock Your Career Potential
          </h2>
          <p className="text-xl text-gray-400 font-inter font-light">
            Explore our AI-powered tools designed to streamline your job search.
          </p>
        </div>
        <div className="
          grid 
          gap-8 
          grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3
          xl:grid-cols-5
          justify-center
          ">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className={`
                ${tool.cardBg}
                rounded-[2.5rem]
                shadow-xl
                flex flex-col 
                items-start
                justify-between
                p-7
                min-h-[340px]
                relative
                group
                transition-all
                duration-300
                border border-black/10
              `}
              style={{
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-2 rounded-full ${tool.iconColor} shadow-md flex items-center justify-center`}>
                  <tool.icon className={`w-8 h-8`} />
                </div>
              </div>
              <div>
                <div className="mb-1">
                  <h3 className="text-2xl font-semibold font-inter text-black">{tool.title}</h3>
                </div>
                <p className="mb-6 text-base font-inter font-normal text-black/80 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className={`mt-auto rounded-full w-full py-3 px-6 flex items-center justify-center gap-2 font-inter text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 ${tool.buttonBg} ${tool.buttonText}`}
                  style={{
                    letterSpacing: "0.03em",
                  }}
                >
                  {tool.title === "AI Interview Prep" ? "Start Prep" :
                  tool.title === "AI Job Analysis" ? "Analyze Jobs" :
                  tool.title === "AI Cover Letters" ? "Create Letters" :
                  tool.title === "Telegram Job Alerts" ? "Set Up Alerts" : 
                  tool.title === "AI LinkedIn Posts" ? "Generate Posts" : "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </SignUpButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
