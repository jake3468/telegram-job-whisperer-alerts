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
      <Card className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-orange-900/15 to-amber-900/20 shadow-2xl shadow-amber-900/20 backdrop-blur-sm hover:border-amber-400/50 transition-all">
        <CardHeader className="pb-4">
          <CardTitle className="text-amber-100 font-orbitron flex items-center gap-3 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-amber-100 font-bold">About You</span>
          </CardTitle>
          <CardDescription className="text-amber-200 font-inter font-normal text-base leading-relaxed">Tell us a bit about yourself — it helps our AI tailor tools to your unique profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <Textarea value={bio} onChange={e => {
          setBio(e.target.value);
          updateActivity(); // Track user activity when typing
        }} onFocus={updateActivity} // Track activity when user focuses the field
        placeholder="I enjoy working with startups and exploring AI. My ambition is to build something impactful that people genuinely find value in." rows={4} className="
              min-h-[140px]
              border border-amber-500/30
              placeholder:text-amber-300/70 font-inter text-amber-100
              focus:border-amber-400/70 focus:ring-amber-400/30 hover:border-amber-400/50
              text-base resize-none
              bg-amber-900/20
              shadow-lg rounded-xl
              transition-all
            " />
          <Button onClick={handleSaveBio} disabled={saving} className="w-full sm:w-auto font-inter bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-2 px-8 rounded-lg shadow-lg border border-amber-500/30">
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </CardContent>
      </Card>
    </section>;
};
export default BioSection;