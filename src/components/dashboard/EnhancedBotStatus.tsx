import { CheckCircle, XCircle, Loader2, Bot } from 'lucide-react';
interface BotStatusProps {
  onActivationChange: () => void;
  isActivated: boolean;
  loading: boolean;
}
const EnhancedBotStatus = ({
  onActivationChange,
  isActivated,
  loading
}: BotStatusProps) => {
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
  return <div className="border border-orange-600 rounded-lg p-4 mb-6 bg-slate-950">
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
          <li>The bot will ask for your "Bot ID" 🔑. Copy your Bot ID from your dashboard and send it to the bot.</li>
          <li>Once successful, you'll receive a message: "Bot successfully activated! ✅"</li>
          <li>🎯 You're all set! You can now set your Job Alerts below.</li>
          <li>🔔 Make sure the Telegram bot is not muted, so you don't miss your daily job alerts.</li>
        </ol>
      </div>
    </div>;
};
export default EnhancedBotStatus;