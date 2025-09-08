import { Layout } from '@/components/Layout';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, CalendarPlus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { detectAndStoreLocation } from '@/utils/locationDetection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ActivationStatusTag from '@/components/ActivationStatusTag';
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
            <span className="text-2xl sm:text-3xl md:text-4xl">🚀</span>
            <span className="text-cyan-300 text-left font-inter text-3xl sm:text-3xl md:text-4xl">Your AI Agents</span>
          </h1>
          <p className="text-sm lg:text-base text-white font-inter font-light mb-3 text-left max-w-2xl mx-auto lg:text-left">
            First, let's meet and activate your personal <span className="whitespace-nowrap">AI Job agents</span> - they're ready to guide you through every step of your job hunt<span className="lg:inline"> </span><br className="lg:hidden" />(😉 you'll be amazed at what they can do!).
          </p>
        </div>

        {/* User Profile ID Section */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="p-3 sm:p-4 lg:p-6 rounded-lg border border-border" style={{backgroundColor: '#30313D'}}>
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

        {/* AI Agents Accordion */}
        <div className="max-w-4xl mx-auto px-4">
          <Accordion type="multiple" className="w-full space-y-4">
            {/* Resume Builder Agent */}
            <AccordionItem value="resume-builder" className="border border-border rounded-lg" style={{backgroundColor: '#30313D'}}>
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <ActivationStatusTag isActivated={userProfile?.cv_bot_activated} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">📝 Resume Builder Agent</h3>
                    <p className="text-gray-300 text-sm mt-1">Transform your resume into a sharp, job-ready version.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Get a clean, ATS-friendly format that's keyword-optimized and highlights your achievements. You can easily add new projects, update experiences, and tailor your resume for every job - just by chatting with it.
                  </p>
                  <Button 
                    onClick={async () => {
                      await detectAndStoreLocation(userProfile, updateUserProfile);
                      window.open('https://t.me/Resume_builder_AI_bot', '_blank');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Activate Now
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Job Alerts Agent */}
            <AccordionItem value="job-alerts" className="border border-border rounded-lg" style={{backgroundColor: '#30313D'}}>
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <ActivationStatusTag isActivated={userProfile?.bot_activated} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">🔔 Job Alerts Agent</h3>
                    <p className="text-gray-300 text-sm mt-1">Daily web scanning for the latest jobs at your chosen time.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Get fresh, relevant roles delivered right when you need them, with one-click access to tailored resumes, applications, interview prep & more.. for every opportunity.
                  </p>
                  <Button 
                    onClick={async () => {
                      await detectAndStoreLocation(userProfile, updateUserProfile);
                      window.open('https://t.me/Job_AI_update_bot', '_blank');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 mb-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Activate Now
                  </Button>
                  <div className="pt-2 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-2 text-center">
                      After activating the Job Alerts AI Agent, click "Create Job Alerts" below to set your daily preferences.
                    </p>
                    <Button 
                      onClick={async () => {
                        await detectAndStoreLocation(userProfile, updateUserProfile);
                        navigate('/job-alerts');
                        window.scrollTo(0, 0);
                      }} 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Create Job Alerts
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Job Application Agent */}
            <AccordionItem value="job-application" className="border border-border rounded-lg" style={{backgroundColor: '#30313D'}}>
              <AccordionTrigger className="hover:no-underline px-4 py-3">
                <div className="flex items-center gap-3 text-left w-full">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <ActivationStatusTag isActivated={userProfile?.add_job_bot_activated} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">👔 Job Application Agent</h3>
                    <p className="text-gray-300 text-sm mt-1">Your quick helper when you find a job.</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Share a few details and instantly receive a tailored resume, cover letter, HR contacts, interview prep & more.. - everything you need to apply with confidence.
                  </p>
                  <Button 
                    onClick={async () => {
                      await detectAndStoreLocation(userProfile, updateUserProfile);
                      window.open('https://t.me/add_job_aspirelyai_bot', '_blank');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Activate Now
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Layout>;
};
export default AIAgents;