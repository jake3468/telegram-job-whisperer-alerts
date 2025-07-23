import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { CheckCircle, XCircle, Loader2, Bot } from 'lucide-react';
interface BotStatusProps {
  onActivationChange: () => void;
}
const EnhancedBotStatus = ({
  onActivationChange
}: BotStatusProps) => {
  const {
    userProfile,
    loading
  } = useCachedUserProfile();
  const isActivated = userProfile?.bot_activated === true;
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
  return <div className="bg-orange-900/50 border border-orange-600 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <XCircle className="w-5 h-5 text-orange-400" />
        <span className="text-orange-300 font-medium">Bot Not Yet Activated</span>
      </div>
      
      <div className="space-y-3">
        <p className="text-orange-200 text-sm">
          Follow these steps to activate your Telegram bot for job alerts:
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-orange-100">Search for our bot on Telegram: <code className="bg-orange-800/50 px-1 rounded">@YourJobBot</code></span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-orange-100">Start a conversation by sending <code className="bg-orange-800/50 px-1 rounded">/start</code></span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-orange-100">Follow the bot's instructions to link your account</span>
          </div>
        </div>
      </div>
    </div>;
};
export default EnhancedBotStatus;