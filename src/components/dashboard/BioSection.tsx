import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useFormTokenKeepAlive } from '@/hooks/useFormTokenKeepAlive';
const BioSection = () => {
  const {
    toast
  } = useToast();
  const {
    userProfile,
    loading,
    updateUserProfile
  } = useCachedUserProfile();
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [saving, setSaving] = useState(false);
  
  // Keep tokens fresh while user is interacting with bio form
  const { updateActivity, silentTokenRefresh } = useFormTokenKeepAlive(true);
  React.useEffect(() => {
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    }
  }, [userProfile]);
  const handleSaveBio = async () => {
    setSaving(true);
    try {
      // Refresh token before making the save request
      await silentTokenRefresh();
      
      const {
        error
      } = await updateUserProfile({
        bio
      });
      if (error) {
        throw new Error(error);
      }
      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your bio.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <Card className="border-2 border-emerald-400 shadow-none">
        <CardContent className="p-4">
          <div className="text-white text-xs">Loading...</div>
        </CardContent>
      </Card>;
  }
  return <section className="p-0 rounded-none bg-transparent shadow-none">
      <Card className="rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-emerald-900/90 shadow-2xl shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">
            <div className="w-7 h-7 bg-emerald-400/60 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <User className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-white font-bold">About You</span>
          </CardTitle>
          <CardDescription className="text-white/95 text-base font-inter font-normal drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]">Tell us a bit about yourself — it helps our AI tailor tools to your unique profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Textarea 
            value={bio} 
            onChange={(e) => {
              setBio(e.target.value);
              updateActivity(); // Track user activity when typing
            }}
            onFocus={updateActivity} // Track activity when user focuses the field
            placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in." 
            rows={4} 
            className="
              min-h-[100px]
              border-2 border-white/30
              placeholder-white/85 font-inter text-white
              focus-visible:border-emerald-200 hover:border-emerald-300
              text-base resize-none
              bg-black
              shadow-inner
              transition-all
            " 
            style={{
              backgroundColor: "#101113",
              // A very dark, near-black (almost pure black)
              backgroundImage: "none",
              // No gradients, just black/dark
              color: "#fff"
            }} 
          />
          <Button onClick={handleSaveBio} disabled={saving} className="font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow-lg shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-colors text-white bg-blue-800 hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </CardContent>
      </Card>
    </section>;
};
export default BioSection;