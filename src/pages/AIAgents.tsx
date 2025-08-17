import { Layout } from '@/components/Layout';
import FeatureSection from '@/components/FeatureSection';

const AIAgents = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2 font-inter">
            Meet Your AI Agents
          </h2>
          <p className="text-base sm:text-xl text-gray-400 font-inter font-light">
            Activate your personal AI agents, ready to guide you through every step of your job hunt.
          </p>
        </div>

        {/* Agent Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Job Application Agent */}
          <FeatureSection
            title="👔 Job Application Agent"
            subheading="Your quick helper when you find a job."
            description="I'll be your quick helper when you find a job. Share the basics, and I'll give you everything from a tailored resume to HR contacts in one click."
            lottieUrl=""
            buttonText="Activate Now"
            isReversed={false}
          />

          {/* Job Alerts Agent */}
          <FeatureSection
            title="🔔 Job Alerts Agent"
            subheading="Daily web scanning for the latest jobs at your chosen time."
            description="I'll scan the web daily and send you the latest jobs at your chosen time. Fresh, relevant roles delivered right when you need them."
            lottieUrl=""
            buttonText="Activate Now"
            isReversed={true}
          />

          {/* Resume Builder Agent */}
          <FeatureSection
            title="📝 Resume Builder Agent"
            subheading="Transform your resume into a sharp, job-ready version."
            description="I'll turn your resume into a sharp, job-ready version. Clean format, keyword-optimized, and packed with achievements that stand out."
            lottieUrl=""
            buttonText="Activate Now"
            isReversed={false}
          />
        </div>
      </div>
    </Layout>
  );
};
export default AIAgents;