
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BotStatusProps {
  onActivationChange: () => void;
}

const BotStatus = ({ onActivationChange }: BotStatusProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [isActivated, setIsActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBotStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('user_profile')
        .select('id, bot_activated')
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching bot status:', error);
        return;
      }

      if (profileData) {
        setIsActivated(profileData.bot_activated || false);
        setUserProfileId(profileData.id);
      }
    } catch (error) {
      console.error('Error in fetchBotStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBotStatus();
    setRefreshing(false);
    onActivationChange();
    toast({
      title: "Refreshed",
      description: "Bot status has been updated"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Bot ID copied to clipboard"
    });
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/20 border-2 border-emerald-400/60 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-cyan-900/20 border-2 border-emerald-400/60 shadow-lg">
      <CardContent className="p-4">
        {/* Only show Bot ID for development/debug purposes - hidden for regular users */}
        {process.env.NODE_ENV === 'development' && userProfileId && (
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-800/30 rounded border border-gray-600/50">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-gray-400 block mb-1">Bot ID:</span>
              <span className="text-sm font-mono text-gray-300 break-all">{userProfileId}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => copyToClipboard(userProfileId)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActivated ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-100 font-semibold">Bot Activated</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <span className="text-orange-100 font-semibold">Bot Not Activated</span>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-900/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-800/30"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {!isActivated && (
          <div className="mt-4 p-3 bg-orange-900/20 border border-orange-400/30 rounded-lg">
            <p className="text-orange-100 text-sm">
              To activate your bot and enable job alerts, please follow the setup instructions in the Telegram Bot Setup section.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BotStatus;
