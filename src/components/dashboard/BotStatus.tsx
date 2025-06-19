import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

interface BotStatusProps {
  onActivationChange?: (isActivated: boolean) => void;
}

const BotStatus = ({ onActivationChange }: BotStatusProps) => {
  const { toast } = useToast();
  const { userProfile, loading } = useUserProfile();
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [copiedBotName, setCopiedBotName] = useState(false);

  useEffect(() => {
    if (userProfile) {
      onActivationChange?.(userProfile.bot_activated || false);
    }
  }, [userProfile, onActivationChange]);

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

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-black/90 rounded-xl">
        <div className="text-white text-sm">Loading bot status...</div>
      </div>
    );
  }

  // Use the user_profile.id as the Bot ID
  const botId = userProfile?.id || '';
  const isActivated = userProfile?.bot_activated || false;

  return (
    <div className="mb-6">
      {/* Bot ID Display */}
      <div className="bg-neutral-900 rounded-xl p-4 mb-4 border border-emerald-400 transition-all">
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
              ? "bg-emerald-600/95 border-emerald-400 text-white"
              : "bg-red-600/90 border-red-400 text-white"
          ].join(' ')}
          style={{ minHeight: '40px', transition: 'background 0.2s' }}
        >
          <div className={`w-3 h-3 rounded-full ${isActivated ? 'bg-green-300' : 'bg-red-300'} shadow-lg`} />
          <span className={isActivated ? "text-white" : "text-white"}>
            {isActivated ? 'Bot Activated' : 'Bot not yet Activated'}
          </span>
        </div>
      </div>

      {/* Activation Instructions - Only show when not activated */}
      {!isActivated && (
        <div className="bg-black/40 rounded-lg p-4 text-white border border-red-800">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-medium text-white mb-4 font-inter">🤖 How to Activate the Job Alert Bot on Telegram:</h3>
            
            <ol className="text-sm space-y-2 font-inter text-gray-200 list-decimal list-inside">
              <li>Open your 'Telegram' app</li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0">2.</span>
                <div className="flex items-center gap-2 flex-wrap">
                  Copy the bot name: 
                  <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded">
                    <code className="text-orange-200">Job_AI_update_bot</code>
                    <Button
                      onClick={() => copyToClipboard('Job_AI_update_bot', 'botName')}
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
              <li>🎯 You're all set! You can now set your Job Alerts below.</li>
              <li>🔔 Make sure the Telegram bot is not muted, so you don't miss your daily job alerts.<br />🔄 Refresh this page now to check the bot activation status.</li>
            </ol>

            <h3 className="text-lg font-medium text-white mt-6 mb-3 font-inter">📩 What You'll Get from the Bot:</h3>
            
            <ul className="text-sm space-y-2 font-inter text-gray-200 list-disc list-inside">
              <li><strong>Daily job alerts tailored to your profile</strong>, with a detailed analysis for each job.</li>
              <li>Each job message includes a <strong>"Get Cover Letter"</strong> button for instant, personalized cover letters.</li>
              <li>You can also <strong>send any job post URL</strong>, and the bot will analyze whether the job is a good fit for you or not.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotStatus;
