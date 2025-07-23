
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Bot, MessageSquare } from 'lucide-react';

interface BotStatusProps {
  onActivationChange: () => void;
}

const EnhancedBotStatus = ({ onActivationChange }: BotStatusProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [botStatus, setBotStatus] = useState<{
    isActivated: boolean;
    hasChatId: boolean;
    loading: boolean;
  }>({
    isActivated: false,
    hasChatId: false,
    loading: true
  });

  // Check bot activation status
  const checkBotStatus = async () => {
    if (!user) return;

    setBotStatus(prev => ({ ...prev, loading: true }));

    try {
      await makeAuthenticatedRequest(async () => {
        const { data, error } = await supabase
          .from('user_profile')
          .select('bot_activated, chat_id')
          .eq('user_id', (await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .single()
          ).data?.id)
          .single();

        if (error) {
          console.error('Error checking bot status:', error);
          return;
        }

        const isActivated = data?.bot_activated === true;
        const hasChatId = Boolean(data?.chat_id);

        setBotStatus({
          isActivated,
          hasChatId,
          loading: false
        });

        console.log('[EnhancedBotStatus] Status check:', {
          bot_activated: data?.bot_activated,
          chat_id: data?.chat_id,
          isActivated,
          hasChatId
        });
      });
    } catch (error) {
      console.error('[EnhancedBotStatus] Error checking status:', error);
      setBotStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkBotStatus();
  }, [user]);

  // Determine the overall activation status - if bot_activated is true, bot is activated
  const isFullyActivated = botStatus.isActivated;
  const needsActivation = !botStatus.isActivated;

  if (botStatus.loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-gray-300 text-sm">Checking bot status...</span>
        </div>
      </div>
    );
  }

  if (isFullyActivated) {
    return (
      <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-medium">Bot Activated</span>
        </div>
        <p className="text-green-200 text-sm">
          Your Telegram bot is active and ready to send job alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange-900/50 border border-orange-600 rounded-lg p-4 mb-6">
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

        <div className="flex gap-2 pt-2">
          <Button
            onClick={checkBotStatus}
            variant="outline"
            size="sm"
            className="text-xs bg-orange-800/30 border-orange-500/50 text-orange-200 hover:bg-orange-700/40"
          >
            <Bot className="w-3 h-3 mr-1" />
            Check Status
          </Button>
        </div>
        
        <div className="text-xs text-orange-300 mt-2">
          Status: {botStatus.hasChatId ? '✅ Connected' : '❌ Not Connected'} | 
          {botStatus.isActivated ? '✅ Activated' : '❌ Not Activated'}
        </div>
      </div>
    </div>
  );
};

export default EnhancedBotStatus;
