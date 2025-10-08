import { Layout } from '@/components/Layout';
import FeatureSection from '@/components/FeatureSection';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { detectAndStoreLocation } from '@/utils/locationDetection';
import jobAlertsAgentPreview from '@/assets/job-alerts-agent-preview.svg';
import resumeBuilderAgentPreview from '@/assets/resume-builder-agent-preview.svg';
import jobApplicationPreview from '@/assets/job-application-preview.svg';
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
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          {/* Mobile Layout */}
          <h1 className="lg:hidden font-orbitron mb-2 drop-shadow tracking-tight font-bold flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🚀</span>
            <div className="flex flex-col items-center">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-inter text-3xl">Activate your</span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-inter text-3xl">AI Job Agents</span>
            </div>
          </h1>
          
          {/* Desktop Layout */}
          <h1 className="hidden lg:flex font-orbitron mb-2 drop-shadow tracking-tight font-bold text-4xl items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl md:text-4xl">🚀</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-inter text-3xl sm:text-3xl md:text-4xl">Activate your AI Job Agents</span>
          </h1>
          <p className="text-sm lg:text-base text-gray-900 font-inter font-normal mb-3 text-left max-w-2xl mx-auto lg:text-left">
            To get started, let's activate your personal AI job agents on Telegram in just 3 simple steps 👇 to help you land your dream job.
          </p>
        </div>

        {/* User Profile ID Section */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-300 bg-gray-50">
            <p className="font-inter font-normal text-gray-900 text-sm sm:text-base text-left mb-1 sm:mb-2">
              1. Copy your Activation Key given below.
            </p>
            {userProfile?.id ? <div className="flex items-center gap-2 rounded-lg p-2 sm:p-3 border border-blue-300 bg-blue-100 mb-4">
                <code className="text-blue-900 font-mono text-xs sm:text-sm flex-1 break-all min-w-0">
                  {userProfile.id}
                </code>
                <Button onClick={copyUserProfileId} variant="outline" size="sm" className="hover:bg-blue-200 border-blue-300 text-blue-700 flex-shrink-0">
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div> : <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Loading Activation Key...</span>
              </div>}
            <p className="font-inter font-normal text-gray-900 text-sm sm:text-base text-left mb-1 sm:mb-2">
              2. Click the "Activate Now" button, one by one, for each of the 3 AI Agents.<br /><br />
              3. When it asks for your activation key, paste it to start using your AI agents.
            </p>
          </div>
        </div>

        {/* Agent Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Job Alerts Agent */}
          <FeatureSection title="🔔 Job Alerts Agent" subheading="Daily web scanning for the latest jobs at your chosen time." description="Get only the latest relevant roles posted in the last 24 hours when you need them. No spam. No old jobs. Just one click access to today's opportunities plus resumes and interview prep" lottieUrl="" buttonText="Activate Now" isReversed={true} label="1" buttonUrl="https://t.me/Job_AI_update_bot" shouldDetectLocation={true} activationStatus={userProfile?.bot_activated} imageSrc={jobAlertsAgentPreview} additionalContent={<>
                <p className="text-sm md:text-base text-gray-700 mb-2 text-center">
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

          {/* Resume Builder Agent */}
          <FeatureSection title="📝 Resume Builder Agent" subheading="Transform your resume into a sharp, job-ready version." description="Instantly create an ATS-friendly Resume PDF that highlights your achievements. Update and tailor it for every job with just a chat" lottieUrl="" buttonText="Activate Now" isReversed={false} label="2" buttonUrl="https://t.me/Resume_builder_AI_bot" shouldDetectLocation={true} activationStatus={userProfile?.cv_bot_activated} imageSrc={resumeBuilderAgentPreview} />

          {/* Job Application Agent */}
          <FeatureSection title="👔 Job Application Agent" subheading="Your quick helper when you find a job." description="Share a few details and instantly receive a tailored resume, cover letter, HR contacts, interview prep & more.. - everything you need to apply with confidence" lottieUrl="" buttonText="Activate Now" isReversed={false} label="3" buttonUrl="https://t.me/add_job_aspirelyai_bot" shouldDetectLocation={true} activationStatus={userProfile?.add_job_bot_activated} imageSrc={jobApplicationPreview} />
        </div>
      </div>
    </Layout>;
};
export default AIAgents;