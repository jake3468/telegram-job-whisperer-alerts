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
  const {
    updateActivity,
    silentTokenRefresh
  } = useFormTokenKeepAlive(true);
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
      <Card className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 shadow-2xl shadow-slate-900/50 backdrop-blur-sm hover:border-slate-600/50 transition-all">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-100 font-orbitron flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-100 font-bold">About You</span>
          </CardTitle>
          <CardDescription className="text-slate-300 font-inter font-normal text-base leading-relaxed">Tell us a bit about yourself — it helps our AI tailor tools to your unique profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <Textarea value={bio} onChange={e => {
          setBio(e.target.value);
          updateActivity(); // Track user activity when typing
        }} onFocus={updateActivity} // Track activity when user focuses the field
        placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in." rows={4} className="
              min-h-[140px]
              border border-slate-600/50
              placeholder:text-slate-400 font-inter text-slate-100
              focus:border-emerald-400/70 focus:ring-emerald-400/30 hover:border-slate-500/70
              text-base resize-none
              bg-slate-800/60
              shadow-lg rounded-xl
              transition-all
            " />
          <Button onClick={handleSaveBio} disabled={saving} className="w-full sm:w-auto font-inter bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 px-8 rounded-lg shadow-lg border border-emerald-500/30">
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </CardContent>
      </Card>
    </section>;
};
export default BioSection;