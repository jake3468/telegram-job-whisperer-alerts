
import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserCompletionStatus } from '@/hooks/useUserCompletionStatus';

interface CVBotStatusProps {
  onActivationChange?: (isActivated: boolean) => void;
}

const CVBotStatus = ({ onActivationChange }: CVBotStatusProps) => {
  const { toast } = useToast();
  const { userProfile, loading } = useUserProfile();
  const { hasResume, hasBio, loading: completionLoading } = useUserCompletionStatus();
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [copiedBotName, setCopiedBotName] = useState(false);
  
  // Connection and error state management
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [lastSuccessfulProfile, setLastSuccessfulProfile] = useState<any>(null);
  const [lastSuccessfulCompletion, setLastSuccessfulCompletion] = useState<any>(null);

  // Cache successful data fetches
  useEffect(() => {
    if (userProfile && !loading) {
      setLastSuccessfulProfile(userProfile);
      setConnectionIssue(false);
    } else if (loading === false && !userProfile) {
      setConnectionIssue(true);
    }
  }, [userProfile, loading]);

  useEffect(() => {
    if ((hasResume !== undefined || hasBio !== undefined) && !completionLoading) {
      setLastSuccessfulCompletion({ hasResume, hasBio });
      setConnectionIssue(false);
    }
  }, [hasResume, hasBio, completionLoading]);

  // Manual refresh function - refreshes entire page for persistent issues
  const handleManualRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Use cached data when available during connection issues
  const displayProfile = userProfile || lastSuccessfulProfile;
  const displayCompletion = lastSuccessfulCompletion || { hasResume, hasBio };

  // Check if user has both resume and bio data with cached fallback
  const hasRequiredData = displayCompletion.hasResume && displayCompletion.hasBio;
  const isActivated = displayProfile?.cv_bot_activated && hasRequiredData;

  useEffect(() => {
    if (displayProfile) {
      onActivationChange?.(isActivated || false);
    }
  }, [displayProfile, isActivated, onActivationChange]);

  const copyToClipboard = async (text: string, type: 'botId' | 'botName') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'botId') {
        setCopiedBotId(true);
        setTimeout(() => setCopiedBotId(false), 2000);
      } else {
        setCopiedBotName(true);
        setTimeout(() => setCopiedBotName(false), 2000);
      }

      toast({
        title: "Copied!",
        description: `${type === 'botId' ? 'Bot ID' : 'Bot name'} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if ((loading || completionLoading) && !displayProfile && !lastSuccessfulCompletion) {
    return (
      <div className="mb-6 p-4 bg-black/90 rounded-xl">
        <div className="text-white text-sm">Loading bot status...</div>
      </div>
    );
  }

  // Use the user_profile.id as the Bot ID with cached fallback
  const botId = displayProfile?.id || '';
  const isBotTechnicallyActivated = displayProfile?.cv_bot_activated || false;

  return (
    <div className="mb-6">
      {/* Manual Refresh Button */}
      {connectionIssue && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            size="sm"
            className="text-xs bg-yellow-900/20 border-yellow-400/30 text-yellow-300 hover:bg-yellow-800/30"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* Profile Completion Warning - Show if bot is activated but missing data */}
      {isBotTechnicallyActivated && !hasRequiredData && (
        <div className="bg-yellow-800/40 rounded-lg p-4 text-white border border-yellow-600 mb-4">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-medium text-yellow-200 mb-3 font-inter">⚠️ Complete Your Profile to Use the Bot</h3>
            <p className="text-yellow-100 font-inter text-sm mb-3">
              Your bot is activated, but you need to complete your profile first:
            </p>
             <ul className="text-sm space-y-1 font-inter text-yellow-100 list-disc list-inside mb-3">
               {!displayCompletion.hasBio && <li>Add your bio in the Profile page</li>}
               {!displayCompletion.hasResume && <li>Upload your resume in the Profile page</li>}
             </ul>
            <p className="text-yellow-100 font-inter text-sm">
              Please go to the <strong>Profile</strong> page and complete these sections to start using your Resume Bot.
            </p>
          </div>
        </div>
      )}

      {/* Bot ID Display */}
      <div className="bg-neutral-900 rounded-xl p-4 mb-4 border border-fuchsia-400 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-inter text-sm">Bot ID:</span>
          <div className="flex items-center gap-2">
            <code className="text-orange-200 font-mono text-sm bg-black/40 px-2 py-1 rounded">
              {botId}
            </code>
            <Button
              onClick={() => copyToClipboard(botId, 'botId')}
              className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30 text-white"
              size="sm"
            >
              {copiedBotId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Strong Visibility Status Bar */}
        <div
          className={[
            "rounded-lg px-4 py-2 flex items-center gap-3 font-inter text-base font-semibold border-2 mt-2",
            isActivated
              ? "bg-green-600/95 border-green-400 text-white"
              : "bg-red-600/90 border-red-400 text-white"
          ].join(' ')}
          style={{ minHeight: '40px', transition: 'background 0.2s' }}
        >
          <div className={`w-3 h-3 rounded-full ${isActivated ? 'bg-green-300' : 'bg-red-300'} shadow-lg`} />
          <span className="text-white">
            {isActivated ? 'Bot Activated' : 'Bot not yet Activated'}
          </span>
        </div>
      </div>

      {/* Activation Instructions - Only show when not activated OR missing profile data */}
      {(!isBotTechnicallyActivated || !hasRequiredData) && (
        <div className="bg-black/40 rounded-lg p-4 text-white border border-red-800">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-medium text-white mb-4 font-inter">🤖 How to Activate your Resume Assistant Bot on Telegram:</h3>
            
            <ol className="text-sm space-y-2 font-inter text-gray-200 list-decimal list-inside">
              <li>Open your 'Telegram' app</li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">2.</span>
                <div className="flex items-center gap-2 flex-wrap">
                  Copy the bot name: 
                  <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded">
                    <code className="text-orange-200">Resume_builder_AI_bot</code>
                    <Button
                      onClick={() => copyToClipboard('Resume_builder_AI_bot', 'botName')}
                      className="h-4 w-4 p-0 bg-white/20 hover:bg-white/30 text-white"
                      size="sm"
                    >
                      {copiedBotName ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </li>
              <li>Paste it into Telegram's search bar 🔍 and open the bot.</li>
              <li>Click the 'Start' button in the chat. If you don't see it, type '<code className="bg-black/30 px-1 rounded text-orange-200">/start</code>' and send it.</li>
              <li>The bot will ask for your "Bot ID" 🔑. Copy the Bot ID (given above) and send it to the bot.</li>
              <li>Once successful, you'll receive a message: "Bot successfully activated! ✅"</li>
              <li>🎯 You're all set! You can now start talking with the bot and update your resume based on your career goals, job requirements, latest information. No more manual editing! Let our intelligent AI bot handle all your resume updates, formatting, and customization automatically - just chat with it and get a perfectly crafted resume every time</li>
              <li>🔔 Make sure the Telegram bot is not muted, so you don't miss important updates.<br />🔄 Refresh this page now to check the bot activation status.</li>
            </ol>

            <h3 className="text-lg font-medium text-white mt-6 mb-3 font-inter">📩 What You'll Get from the Bot:</h3>
            
            <ul className="text-sm space-y-2 font-inter text-gray-200 list-disc list-inside">
              <li><strong>📝 Professional Resume Creation</strong> - Get a perfectly formatted resume (in pdf) tailored to your experience and target job, ready for printing or further styling</li>
              <li><strong>💼 Job-Specific Optimization</strong> - Your resume will be customized with relevant keywords and skills that match specific job descriptions to increase your chances of getting shortlisted</li>
              <li><strong>📊 Achievement Quantification</strong> - Transform basic job descriptions into impactful statements with metrics and numbers that make your accomplishments stand out to employers</li>
            </ul>
          </div>
        </div>
      )}

      {/* Usage Instructions - Only show when fully activated with profile data */}
      {isActivated && (
        <div className="bg-black/40 rounded-lg p-4 text-white border border-green-800">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-medium text-white mb-4 font-inter">🤖 How to Use the Resume Builder Bot</h3>
            
            <div className="text-sm space-y-3 font-inter text-gray-200">
              <p><strong>💬 Start the conversation</strong> – The bot will greet you and ask whether you want to update an existing resume, tailor it for a specific job, or create a new one from scratch.</p>
              
              <p><strong>📝 Update your current resume (if you have one)</strong> – The bot will analyze your existing resume and identify areas for improvement or updates.</p>
              
              <p><strong>📄 Provide job description (optional)</strong> – If you're applying for a specific role, share the job posting so the bot can tailor your resume with relevant keywords and skills.</p>
              
              <p><strong>❓ Answer questions one by one</strong> – The bot will ask detailed questions about your work experience, skills, education, and achievements. Answer each question thoroughly and honestly.</p>
              
              <p><strong>📊 Confirm quantifiable achievements</strong> – When the bot suggests adding metrics (like "increased efficiency by 30%"), confirm if the numbers are accurate or provide your own estimates.</p>
              
              <p><strong>📥 Receive your resume in PDF format</strong> – After gathering all information and your approval, the bot will generate a clean resume that you can save, print, or style further.</p>
              
              <p className="mt-4 text-green-200">The entire process is <strong>🗣️ conversational</strong> and <strong>🔄 step-by-step</strong>, designed to help you create a professional, tailored resume easily via Telegram.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVBotStatus;
