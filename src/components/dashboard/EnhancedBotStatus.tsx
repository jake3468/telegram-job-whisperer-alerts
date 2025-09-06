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
  return <div className="border border-orange-600 rounded-lg p-4 mb-6 bg-black/80">
      <div className="flex items-center gap-3 mb-3">
        <XCircle className="w-5 h-5 text-orange-400" />
        <span className="text-orange-300 font-medium text-lg">Bot Not Yet Activated</span>
      </div>
      
      <div className="space-y-4">
        <p className="text-orange-200 text-sm">
          You haven't activated your Job Alerts AI agent on Telegram. Copy the below activation key and activate it.
        </p>
        
        {/* Bot ID Display */}
        {userProfile?.id && (
          <div className="bg-gray-900/80 border border-orange-600 rounded-lg p-3">
            <div className="flex flex-col gap-2">
              <span className="text-orange-200 text-sm font-medium">Your Activation Key:</span>
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
        
        <p className="text-orange-200 text-sm">Click the button below:</p>
        
        <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
          <a href="https://t.me/Job_AI_update_bot" target="_blank" rel="noopener noreferrer">
            Activate Now
          </a>
        </Button>
      </div>
    </div>;
};
export default EnhancedBotStatus;