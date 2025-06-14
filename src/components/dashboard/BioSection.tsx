
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const BioSection = () => {
  const {
    toast
  } = useToast();
  const {
    userProfile,
    loading,
    updateUserProfile
  } = useUserProfile();
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [saving, setSaving] = useState(false);
  React.useEffect(() => {
    if (userProfile?.bio) {
      setBio(userProfile.bio);
    }
  }, [userProfile]);
  const handleSaveBio = async () => {
    setSaving(true);
    try {
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
      <Card className="rounded-3xl border-2 border-emerald-400 bg-gradient-to-b from-[#21c37d]/95 via-[#14825f]/90 to-[#105340]/96 shadow-md transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-[0_2px_10px_rgba(67,232,161,0.30)]">
            <div className="w-7 h-7 bg-emerald-400/50 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]" />
            </div>
            <span className="text-white font-bold">About You</span>
          </CardTitle>
          <CardDescription className="text-white/90 text-base font-inter font-normal drop-shadow-[0_2px_10px_rgba(67,232,161,0.35)]">
            Tell us about yourself to get better job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your experience, skills, career goals, and what kind of opportunities you're looking for..." rows={4} className="min-h-[100px] border-2 border-white/30 text-white placeholder-white/70 font-inter focus-visible:border-emerald-200 hover:border-emerald-300 text-base resize-none bg-black/80 shadow-inner" />
          <Button
            onClick={handleSaveBio}
            disabled={saving}
            className="font-inter font-bold text-xs px-4 py-2 h-9 rounded-lg shadow 
              bg-emerald-500 hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-300 text-white transition-colors"
          >
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </CardContent>
      </Card>
    </section>;
};
export default BioSection;
