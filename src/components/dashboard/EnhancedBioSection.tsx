import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, AlertCircle, CheckCircle } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useOptimizedFormTokenKeepAlive } from '@/hooks/useOptimizedFormTokenKeepAlive';

const EnhancedBioSection = () => {
  const { toast } = useToast();
  const { userProfile, loading, updateUserProfile } = useCachedUserProfile();
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveAttempts, setSaveAttempts] = useState(0);

  // Optimized token keep-alive with reduced frequency
  const { updateActivity, smartTokenRefresh, isReady } = useOptimizedFormTokenKeepAlive(true);

  React.useEffect(() => {
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    }
  }, [userProfile]);

  const handleSaveBio = async () => {
    if (saving) return;
    
    setSaving(true);
    setSaveError(null);
    const currentAttempt = saveAttempts + 1;
    setSaveAttempts(currentAttempt);

    try {
      // Ensure token is fresh before saving
      await smartTokenRefresh();
      
      // Small delay to ensure token propagation
      await new Promise(resolve => setTimeout(resolve, 200));

      const { error } = await updateUserProfile({ bio });
      
      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully.",
        duration: 3000
      });

      setSaveAttempts(0); // Reset on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(errorMessage);
      
      // Retry logic for JWT-related errors
      if ((errorMessage.includes('JWT') || errorMessage.includes('unauthorized') || errorMessage.includes('expired')) && currentAttempt < 3) {
        
        // Wait and retry with fresh token
        setTimeout(async () => {
          await smartTokenRefresh();
          setTimeout(() => handleSaveBio(), 500);
        }, 1000 * currentAttempt); // Exponential backoff
        
        return;
      }

      toast({
        title: "Save failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-emerald-400 shadow-none">
        <CardContent className="p-4">
          <div className="text-white text-xs">Loading bio...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-emerald-900/90 shadow-2xl shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
            <div className="w-7 h-7 bg-emerald-400/60 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <User className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">About You</span>
            {!isReady && (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
          </CardTitle>
          <CardDescription className="text-emerald-50 font-inter font-normal drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)] text-sm">
            Tell us a bit about yourself — it helps our AI tailor tools to your unique profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              updateActivity();
              setSaveError(null); // Clear error when user types
            }}
            onFocus={updateActivity}
            placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in."
            rows={4}
            className="min-h-[100px] border-2 border-emerald-200/40 placeholder-gray-400 font-inter text-gray-100 focus-visible:border-emerald-200 hover:border-emerald-300 text-base resize-none shadow-inner transition-all bg-black"
          />
          
          {saveError && (
            <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-400/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm">
                Save failed: {saveError}
                {saveAttempts > 0 && ` (Attempt ${saveAttempts}/3)`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveBio}
              disabled={saving || !isReady}
              className="font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-colors text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving...
                </div>
              ) : (
                'Save Bio'
              )}
            </Button>
            
            {saveAttempts === 0 && userProfile?.bio === bio && (
              <div className="flex items-center gap-1 text-emerald-300 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>Saved</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default EnhancedBioSection;
