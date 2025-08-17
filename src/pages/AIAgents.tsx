import { Layout } from '@/components/Layout';
import FeatureSection from '@/components/FeatureSection';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
const AIAgents = () => {
  const {
    userProfile
  } = useCachedUserProfile();
  const {
    toast
  } = useToast();
  const copyUserProfileId = async () => {
    if (userProfile?.id) {
      try {
        await navigator.clipboard.writeText(userProfile.id);
        toast({
          title: "Copied!",
          description: "Your Activation Key has been copied to clipboard"
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually",
          variant: "destructive"
        });
      }
    }
  };
  return <Layout>
      <div className="min-h-screen bg-black">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <h1 className="font-orbitron mb-2 drop-shadow tracking-tight font-bold text-4xl flex items-center justify-center gap-2">
            <span>🤖</span>
            <span style={{
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }} className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-500 bg-clip-text text-purple-500 text-left">
              Meet Your AI Agents
            </span>
          </h1>
          <p className="text-md text-purple-100 font-inter font-light mb-3 text-sm">
            It's time to meet and activate your personal <span className="italic text-pastel-peach">AI agents</span>, ready to guide you through every step of your job hunt.
          </p>
        </div>

        {/* User Profile ID Section */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 mb-3 text-xs sm:text-sm font-medium">
              First click the below 'Activate Telegram Bot' button. When it asks for your 'Activation Key' you need to copy and paste the below:
            </p>
            {userProfile?.id ? <div className="flex items-center gap-2 bg-black rounded-lg p-2 sm:p-3 border border-gray-600">
                <code className="text-white font-mono text-xs sm:text-sm flex-1 break-all min-w-0">
                  {userProfile.id}
                </code>
                <Button onClick={copyUserProfileId} variant="outline" size="sm" className="hover:bg-blue-50 flex-shrink-0">
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div> : <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Loading your Bot ID...</span>
              </div>}
          </div>
        </div>

        {/* Agent Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Job Application Agent */}
          <FeatureSection title="👔 Job Application Agent" subheading="Your quick helper when you find a job." description="I'll be your quick helper when you find a job. Share the basics, and I'll give you everything from a tailored resume to HR contacts in one click." lottieUrl="" buttonText="Activate Now" isReversed={false} label="1" />

          {/* Job Alerts Agent */}
          <FeatureSection title="🔔 Job Alerts Agent" subheading="Daily web scanning for the latest jobs at your chosen time." description="I'll scan the web daily and send you the latest jobs at your chosen time. Fresh, relevant roles delivered right when you need them." lottieUrl="" buttonText="Activate Now" isReversed={true} label="2" />

          {/* Resume Builder Agent */}
          <FeatureSection title="📝 Resume Builder Agent" subheading="Transform your resume into a sharp, job-ready version." description="I'll turn your resume into a sharp, job-ready version. Clean format, keyword-optimized, and packed with achievements that stand out." lottieUrl="" buttonText="Activate Now" isReversed={false} label="3" />
        </div>
      </div>
    </Layout>;
};
export default AIAgents;