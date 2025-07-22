import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, Loader2 } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { AuthenticatedComponent, useAuthenticatedOperation } from '@/components/auth/AuthenticatedComponent';
import { AuthenticationRecovery } from '@/components/auth/AuthenticationRecovery';
import { analyzeAuthError } from '@/utils/authErrorHandler';

const ProfessionalBioSection = () => {
  const { toast } = useToast();
  const { userProfile, loading, updateUserProfile } = useCachedUserProfile();
  const { executeWithAuth, isReady } = useAuthenticatedOperation();
  
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [saving, setSaving] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    }
  }, [userProfile]);

  const handleSaveBio = async () => {
    if (saving || !isReady) return;
    
    setSaving(true);
    setSaveStatus('saving');
    setShowRecovery(false);

    try {
      await executeWithAuth(
        async () => {
          const { error } = await updateUserProfile({ bio });
          if (error) {
            throw new Error(error);
          }
        },
        (authError) => {
          // Handle authentication errors gracefully
          if (authError.isAuthError) {
            setShowRecovery(true);
          }
        }
      );

      setSaveStatus('success');
      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully.",
        duration: 3000
      });

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      const authError = analyzeAuthError(error);
      setSaveStatus('error');
      
      toast({
        title: "Unable to save",
        description: authError.userMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    // Retry the save operation
    handleSaveBio();
  };

  if (loading) {
    return (
      <Card className="border-2 border-emerald-400 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-white text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading bio...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AuthenticatedComponent className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-emerald-900/90 shadow-2xl shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
            <div className="w-7 h-7 bg-emerald-400/60 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <User className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">About You</span>
            {!isReady && (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
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
              setSaveStatus('idle'); // Clear any previous status when user types
            }}
            placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in."
            rows={4}
            className="min-h-[100px] border-2 border-emerald-200/40 placeholder-gray-400 font-inter text-gray-100 focus-visible:border-emerald-200 hover:border-emerald-300 text-base resize-none shadow-inner transition-all bg-black"
          />
          
          {/* Show recovery component when needed */}
          {showRecovery && (
            <AuthenticationRecovery
              onRecoverySuccess={handleRecoverySuccess}
            />
          )}

          <div className="flex items-center justify-between">
            <Button
              onClick={handleSaveBio}
              disabled={saving || !isReady}
              className="font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-colors text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Reconnecting...'}
                </div>
              ) : (
                'Save Bio'
              )}
            </Button>
            
            {/* Success indicator */}
            {saveStatus === 'success' && userProfile?.bio === bio && (
              <div className="flex items-center gap-1 text-emerald-300 text-xs">
                <CheckCircle className="w-3 h-3" />
                <span>Saved</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthenticatedComponent>
  );
};

export default ProfessionalBioSection;