
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BotStatusProps {
  onActivationChange?: (isActivated: boolean) => void;
}

const BotStatus = ({ onActivationChange }: BotStatusProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [botId, setBotId] = useState<string>('');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [copiedBotName, setCopiedBotName] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('bot_id, activated')
        .eq('clerk_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (data) {
        setBotId(data.bot_id || '');
        setIsActivated(data.activated || false);
        onActivationChange?.(data.activated || false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="mb-6 p-4 bg-white/10 rounded-lg">
        <div className="text-white text-sm">Loading bot status...</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Bot ID Display */}
      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-inter text-sm">Bot ID:</span>
          <div className="flex items-center gap-2">
            <code className="text-orange-200 font-mono text-sm bg-black/20 px-2 py-1 rounded">
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
        
        {/* Activation Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActivated ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-inter ${isActivated ? 'text-green-400' : 'text-red-400'}`}>
            {isActivated ? 'Bot Activated' : 'Bot not yet Activated'}
          </span>
        </div>
      </div>

      {/* Activation Instructions - Only show when not activated */}
      {!isActivated && (
        <div className="bg-black/20 rounded-lg p-4 text-white">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-medium text-white mb-4 font-inter">🤖 How to Activate the Job Bot on Telegram:</h3>
            
            <ol className="text-sm space-y-2 font-inter text-gray-200">
              <li>Open your 'Telegram' app</li>
              <li className="flex items-center gap-2">
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
              </li>
              <li>Paste it into Telegram's search bar 🔍 and open the bot.</li>
              <li>Click the 'Start' button in the chat. If you don't see it, type '<code className="bg-black/30 px-1 rounded text-orange-200">/start</code>' and send it.</li>
              <li>The bot will ask for your "Bot ID" 🔑. Copy the Bot ID (given above) and send it to the bot.</li>
              <li>Once successful, you'll receive a message: "Bot successfully activated! ✅"</li>
              <li>🎯 You're all set! You can now set your Job Alerts below.</li>
            </ol>

            <h3 className="text-lg font-medium text-white mt-6 mb-3 font-inter">📩 What You'll Get from the Bot:</h3>
            
            <ul className="text-sm space-y-2 font-inter text-gray-200">
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
