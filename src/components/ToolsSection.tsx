
import { BellRing, ScanSearch, FileText, Linkedin, LayoutDashboard, ArrowRight, Building2, Bot } from "lucide-react";
import { SignUpButton } from "@clerk/clerk-react";

// EVEN MORE desaturated, softened pastel backgrounds and muted buttons/icons for less vibrancy
const tools = [
  {
    icon: BellRing,
    title: "Telegram Job Alerts",
    description: "Get instant job notifications tailored to your profile, directly on Telegram.",
    cardBg: "bg-[#e8b6c6]", // soft, muted pink (was blue)
    buttonBg: "bg-[#a4687a] hover:bg-[#7e4f60] focus:bg-[#7e4f60]", // muted pink for button
    buttonText: "text-white",
    iconColor: "text-pink-800 bg-white/90", // muted pink icon
  },
  {
    icon: ScanSearch,
    title: "Job Analysis",
    description: "Analyze job descriptions against your resume to identify key skills and gaps.",
    cardBg: "bg-[#aecfc1]",
    buttonBg: "bg-[#12714a] hover:bg-[#0b4d34] focus:bg-[#0b4d34]",
    buttonText: "text-white",
    iconColor: "text-green-800 bg-white/90",
  },
  {
    icon: Building2,
    title: "Company Decoder",
    description: "Get deep insights into company culture, values, and what they're really looking for.",
    cardBg: "bg-[#c8d4e8]",
    buttonBg: "bg-[#4a6791] hover:bg-[#344861] focus:bg-[#344861]",
    buttonText: "text-white",
    iconColor: "text-blue-800 bg-white/90",
  },
  {
    icon: LayoutDashboard,
    title: "Interview Prep",
    description: "Know the Company. Nail the Interview. Ask Like a Pro.",
    cardBg: "bg-[#7daab8]",
    buttonBg: "bg-[#145671] hover:bg-[#0a3544] focus:bg-[#0a3544]",
    buttonText: "text-white",
    iconColor: "text-sky-900 bg-white/90",
  },
  {
    icon: FileText,
    title: "Cover Letter",
    description: "Generate personalized cover letters in seconds for any job application.",
    cardBg: "bg-[#e7b891]",
    buttonBg: "bg-[#a4501e] hover:bg-[#74360e] focus:bg-[#74360e]",
    buttonText: "text-white",
    iconColor: "text-orange-800 bg-white/90",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Posts",
    description: "Create engaging LinkedIn posts to boost your professional presence.",
    cardBg: "bg-[#b6a4c9]",
    buttonBg: "bg-[#765696] hover:bg-[#543a6a] focus:bg-[#543a6a]",
    buttonText: "text-white",
    iconColor: "text-purple-800 bg-white/90",
  },
  {
    icon: Bot,
    title: "Telegram Resume Bot",
    description: "Automated resume optimization and job matching through our intelligent Telegram bot.",
    cardBg: "bg-[#d4c8a8]",
    buttonBg: "bg-[#8b7355] hover:bg-[#6b5642] focus:bg-[#6b5642]",
    buttonText: "text-white",
    iconColor: "text-yellow-800 bg-white/90",
  },
];

const ToolsSection = () => {
  return (
    <section className="relative bg-black py-14 px-2 sm:py-16 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-4 font-inter">
            Unlock Your Career Potential
          </h2>
          <p className="text-base sm:text-xl text-gray-400 font-inter font-light">
            Explore our AI-powered tools designed to streamline your job search.
          </p>
        </div>
        <div
          className="
            grid 
            gap-4 sm:gap-6 md:gap-8
            grid-cols-1 
            sm:grid-cols-2 
            lg:grid-cols-3
            xl:grid-cols-4
            2xl:grid-cols-7
            justify-center
          ">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className={`
                ${tool.cardBg}
                rounded-2xl
                shadow-lg
                flex flex-col 
                items-start
                justify-between
                p-4 sm:p-5 md:p-6
                min-h-[180px] sm:min-h-[200px] md:min-h-[250px]
                relative
                group
                transition-all
                duration-300
                border border-black/10
              `}
              style={{
                boxShadow: "0 4px 16px 0 rgba(31,38,135,0.08)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${tool.iconColor} shadow-sm flex items-center justify-center`}>
                  <tool.icon className={`w-7 h-7`} />
                </div>
              </div>
              <div>
                <div className="mb-1">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold font-inter text-black">{tool.title}</h3>
                </div>
                <p className="mb-4 text-sm sm:text-base font-inter font-normal text-black/80 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className={`mt-auto rounded-full w-full py-2 px-3 sm:py-3 sm:px-5 flex items-center justify-center gap-2 font-inter text-sm sm:text-base font-bold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 ${tool.buttonBg} ${tool.buttonText} z-20`}
                  style={{
                    letterSpacing: "0.025em",
                  }}
                >
                  {tool.title === "Interview Prep" ? "Start Prep" :
                    tool.title === "Job Analysis" ? "Analyze Jobs" :
                      tool.title === "Cover Letter" ? "Create Letters" :
                        tool.title === "Telegram Job Alerts" ? "Set Up Alerts" :
                          tool.title === "LinkedIn Posts" ? "Generate Posts" :
                            tool.title === "Company Decoder" ? "Decode Companies" :
                              tool.title === "Telegram Resume Bot" ? "Start Bot" : "Get Started"}
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
