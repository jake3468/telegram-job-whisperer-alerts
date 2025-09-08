import { Layout } from '@/components/Layout';
import FeatureSection from '@/components/FeatureSection';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { detectAndStoreLocation } from '@/utils/locationDetection';
const AIAgents = () => {
  const {
    userProfile,
    updateUserProfile
  } = useCachedUserProfile();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
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
            <span>🚀</span>
            <span style={{
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }} className="bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-500 bg-clip-text text-blue-500 text-left">Your <em>AI</em> Agents</span>
          </h1>
          <p className="text-md text-purple-100 font-inter font-light mb-3 text-sm">
            First, let's meet and activate your personal <span className="italic text-pastel-peach">AI Job agents</span> - they're ready to guide you through every step of your job hunt.
          </p>
        </div>

        {/* User Profile ID Section */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="p-3 sm:p-4 rounded-lg border border-border bg-gray-950">
            <p className="mb-3 text-xs sm:text-sm font-medium text-slate-50">
              Follow the steps below to activate all 3 <span className="text-sky-300">Telegram</span> AI Agents👇<br /><br />
              1. Copy your Activation Key given below.
            </p>
            {userProfile?.id ? <div className="flex items-center gap-2 rounded-lg p-2 sm:p-3 border border-gray-600 bg-blue-800 mb-4">
                <code className="text-white font-mono text-xs sm:text-sm flex-1 break-all min-w-0">
                  {userProfile.id}
                </code>
                <Button onClick={copyUserProfileId} variant="outline" size="sm" className="hover:bg-blue-50 flex-shrink-0">
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div> : <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Loading Activation Key...</span>
              </div>}
            <p className="text-xs sm:text-sm font-medium text-slate-50">
              2. Click the "Activate Now" button, one by one, for each of the 3 AI Agents.<br /><br />
              3. When it asks for your activation key, paste it to start using your AI agents.
            </p>
          </div>
        </div>

        {/* Agent Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Resume Builder Agent */}
          <FeatureSection title="📝 Resume Builder Agent" subheading="Transform your resume into a sharp, job-ready version." description="Get a clean, ATS-friendly format that's keyword-optimized and highlights your achievements. You can easily add new projects, update experiences, and tailor your resume for every job - just by chatting with it." lottieUrl="" buttonText="Activate Now" isReversed={false} label="1" buttonUrl="https://t.me/Resume_builder_AI_bot" shouldDetectLocation={true} activationStatus={userProfile?.cv_bot_activated} />

          {/* Job Alerts Agent */}
          <FeatureSection title="🔔 Job Alerts Agent" subheading="Daily web scanning for the latest jobs at your chosen time." description="Get fresh, relevant roles delivered right when you need them, with one-click access to tailored resumes, applications, interview prep & more.. for every opportunity." lottieUrl="" buttonText="Activate Now" isReversed={true} label="2" buttonUrl="https://t.me/Job_AI_update_bot" shouldDetectLocation={true} activationStatus={userProfile?.bot_activated} additionalContent={<>
                <p className="text-xs text-gray-600 mb-2 text-center">
                  After activating the Job Alerts AI Agent, click "Create Job Alerts" below to set your daily preferences.
                </p>
                <Button onClick={async () => {
            // Detect and store location before navigation
            await detectAndStoreLocation(userProfile, updateUserProfile);
            navigate('/job-alerts');
            window.scrollTo(0, 0);
          }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-xs">
                  <CalendarPlus className="w-3 h-3" />
                  Create Job Alerts
                </Button>
              </>} />

          {/* Job Application Agent */}
          <FeatureSection title="👔 Job Application Agent" subheading="Your quick helper when you find a job." description="Share a few details and instantly receive a tailored resume, cover letter, HR contacts, interview prep & more.. - everything you need to apply with confidence" lottieUrl="" buttonText="Activate Now" isReversed={false} label="3" buttonUrl="https://t.me/add_job_aspirelyai_bot" shouldDetectLocation={true} activationStatus={userProfile?.add_job_bot_activated} />
        </div>
      </div>
    </Layout>;
};
export default AIAgents;