import { useState } from 'react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { CheckCircle, XCircle, Loader2, Bot, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
interface BotStatusProps {
  onActivationChange: () => void;
}
const EnhancedBotStatus = ({
  onActivationChange
}: BotStatusProps) => {
  const { toast } = useToast();
  const [copiedBotId, setCopiedBotId] = useState(false);
  const {
    userProfile,
    loading
  } = useCachedUserProfile();
  const isActivated = userProfile?.bot_activated === true;
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBotId(true);
      setTimeout(() => setCopiedBotId(false), 2000);
      toast({
        title: "Copied!",
        description: "Bot ID copied to clipboard.",
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
    return <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-gray-300 text-sm">Checking bot status...</span>
        </div>
      </div>;
  }
  if (isActivated) {
    return <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-medium">Bot Activated</span>
        </div>
        <p className="text-green-200 text-sm">Your Telegram bot is active and ready to send job alerts. Please add your job alerts by clicking the above (+ Add Alert) button.</p>
      </div>;
  }
  return <div className="border border-orange-600 rounded-lg p-4 mb-6 bg-rose-950">
      <div className="flex items-center gap-3 mb-3">
        <XCircle className="w-5 h-5 text-orange-400" />
        <span className="text-orange-300 font-medium text-lg">Bot Not Yet Activated</span>
      </div>
      
      <div className="space-y-3">
        <p className="text-orange-200 text-sm">
          🤖 How to Activate the Job Alert Bot on Telegram:
        </p>
        
        <ol className="text-sm space-y-2 text-orange-200 list-decimal list-inside">
          <li>Open your 'Telegram' app</li>
          <li>Copy the bot name: <code className="bg-orange-800/50 px-1 rounded text-orange-100">Job_AI_update_bot</code></li>
          <li>Paste it into Telegram's search bar 🔍 and open the bot.</li>
          <li>Click the 'Start' button in the chat. If you don't see it, type '<code className="bg-orange-800/50 px-1 rounded text-orange-100">/start</code>' and send it.</li>
          <li>The bot will ask for your "Bot ID" 🔑. Copy your Bot ID below and send it to the bot.</li>
        </ol>
        
        {/* Bot ID Display */}
        {userProfile?.id && (
          <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-3 mt-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-orange-200 text-sm font-medium">Your Bot ID:</span>
              <div className="flex items-center gap-2">
                <code className="text-orange-100 font-mono text-sm bg-orange-800/50 px-2 py-1 rounded">
                  {userProfile.id}
                </code>
                <Button
                  onClick={() => copyToClipboard(userProfile.id)}
                  className="h-6 w-6 p-0 bg-orange-800/50 hover:bg-orange-700/60 text-orange-100 border border-orange-600/50"
                  size="sm"
                >
                  {copiedBotId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <ol className="text-sm space-y-2 text-orange-200 list-decimal list-inside" start={6}>
          <li>Once successful, you'll receive a message: "Bot successfully activated! ✅"</li>
          <li>🎯 You're all set! You can now set your Job Alerts below.</li>
          <li>🔔 Make sure the Telegram bot is not muted, so you don't miss your daily job alerts.</li>
        </ol>
      </div>
    </div>;
};
export default EnhancedBotStatus;