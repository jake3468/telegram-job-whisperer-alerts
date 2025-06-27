import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import CVBotStatus from '@/components/dashboard/CVBotStatus';
import { useCreditWarnings } from '@/hooks/useCreditWarnings';
import { FileText } from 'lucide-react';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const ResumeBuilder = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isActivated, setIsActivated] = useState<boolean>(false);

  // Replace useFeatureCreditCheck with the new system
  useCreditWarnings(); // This shows the warning popups

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  const handleActivationChange = (activated: boolean) => {
    setIsActivated(activated);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
        <div className="text-fuchsia-900 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="text-center mb-8">
        <h1 className="font-orbitron mb-2 drop-shadow tracking-tight font-bold text-4xl flex items-center justify-center gap-2">
          <span>📑</span>
          <span 
            style={{
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
            className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-500 bg-clip-text text-purple-500"
          >
            Telegram <span className="italic">Resume</span> Bot
          </span>
        </h1>
        <p className="text-md text-purple-100 font-inter font-light text-lg">
          Your personal <span className="italic text-pastel-peach">resume assistant</span> on Telegram — tailor your CV for new roles, job descriptions, or career goals, all through a simple chat
        </p>
      </div>

      {/* Profile Completion Warning */}
      <ProfileCompletionWarning />

      <div className="max-w-4xl mx-auto">
        <section className="rounded-3xl border-2 border-fuchsia-400 bg-gradient-to-b from-fuchsia-900/90 via-[#2b1628]/90 to-[#2b0a28]/98 shadow-none p-0">
          <div className="pt-4 px-2 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                <span className="text-2xl font-orbitron bg-gradient-to-r from-fuchsia-300 via-purple-300 to-pink-400 bg-clip-text text-transparent font-extrabold flex items-center gap-2 drop-shadow">
                  <span className="w-6 h-6 bg-fuchsia-400/70 rounded-full flex items-center justify-center shadow-lg ring-2 ring-fuchsia-300/40">
                    <FileText className="w-4 h-4 text-white" />
                  </span>
                  <span>Resume Bot</span>
                </span>
                <p className="text-fuchsia-100 font-inter text-sm font-semibold drop-shadow-none">
                  Create and customize professional resumes through intelligent conversation
                </p>
              </div>
            </div>

            <div>
              {/* CV Bot Status Component */}
              <CVBotStatus onActivationChange={handleActivationChange} />

              {!isActivated && (
                <div className="text-center py-6">
                  <FileText className="w-10 h-10 text-fuchsia-400 mx-auto mb-3" />
                  <p className="text-fuchsia-100 font-inter text-base mb-1">Activate your bot to start building resumes</p>
                  <p className="text-fuchsia-200 font-inter text-sm">Follow the instructions above to get started</p>
                </div>
              )}
            </div>
          </div>
          <div className="h-2 sm:h-4" />
        </section>
      </div>
    </Layout>
  );
};

export default ResumeBuilder;
