import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useEnterpriseAPIClient } from '@/hooks/useEnterpriseAPIClient';
const ProfessionalBioSection = () => {
  const {
    toast
  } = useToast();
  const {
    userProfile,
    loading,
    updateUserProfile
  } = useCachedUserProfile();
  const {
    makeOptimisticRequest
  } = useEnterpriseAPIClient();
  const defaultBio = '.';
  const [bio, setBio] = useState(userProfile?.bio || defaultBio);
  const [saving, setSaving] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState(false);
  const [originalBio, setOriginalBio] = useState(userProfile?.bio || defaultBio);
  React.useEffect(() => {
    if (userProfile?.bio !== undefined) {
      const bioValue = userProfile.bio || defaultBio;
      setBio(bioValue);
      setOriginalBio(bioValue);
    }
  }, [userProfile, defaultBio]);
  const handleSaveBio = async () => {
    if (saving) return;
    setSaving(true);

    // Enterprise-grade optimistic update with silent recovery
    const {
      success,
      error
    } = await makeOptimisticRequest(
    // Operation
    async () => {
      const result = await updateUserProfile({
        bio
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    // Optimistic update
    () => {
      setOptimisticSaved(true);
      setOriginalBio(bio); // Update the "saved" state
    },
    // Revert update
    () => {
      setBio(originalBio);
      setOptimisticSaved(false);
    },
    // Options
    {
      maxRetries: 3,
      silentRetry: true
    });
    setSaving(false);
    if (success) {
      // Silent success - no intrusive notifications for expected operations
      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully.",
        duration: 2000
      });
    } else {
      // Only show error if all retries failed
      toast({
        title: "Save failed",
        description: error || "Please try again",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Reset optimistic state when user types
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
    if (optimisticSaved && e.target.value !== originalBio) {
      setOptimisticSaved(false);
    }
  };
  if (loading) {
    return <Card className="border-2 border-emerald-400 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-white text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading bio...
          </div>
        </CardContent>
      </Card>;
  }
  const isActuallySaved = originalBio === bio && bio.length > 0;
  const showSavedIndicator = optimisticSaved || isActuallySaved;
  return <Card className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-emerald-900/90 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 backdrop-blur-sm">
      
      <CardContent className="space-y-2 pt-0 p-4">
        <Textarea value={bio} onChange={handleBioChange} placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in." rows={3} className="min-h-[80px] border-2 border-emerald-200/40 placeholder-gray-400 font-inter text-gray-100 focus-visible:border-emerald-200 hover:border-emerald-300 text-sm resize-none shadow-inner transition-all bg-black" />

        <div className="flex items-center justify-between">
          <Button onClick={handleSaveBio} disabled={saving} className="font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-colors text-white bg-blue-800 hover:bg-blue-700 disabled:opacity-50">
            {saving ? <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </div> : 'Save Bio'}
          </Button>
          
          {/* Success indicator */}
          {showSavedIndicator && <div className="flex items-center gap-1 text-emerald-300 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Saved</span>
            </div>}
        </div>
      </CardContent>
    </Card>;
};
export default ProfessionalBioSection;