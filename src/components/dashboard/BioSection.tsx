
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const BioSection = () => {
  const { toast } = useToast();
  const { userProfile, loading, updateUserProfile } = useUserProfile();
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
      const { error } = await updateUserProfile({ bio });

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
    return (
      <Card className="border-2 border-emerald-400 shadow-none">
        <CardContent className="p-4">
          <div className="text-white text-xs">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="p-0 rounded-none bg-transparent shadow-none">
      {/* Vibrant emerald gradient card with crisp border and shadow */}
      <Card className="rounded-3xl border-2 border-emerald-400 bg-gradient-to-b from-[#30e894]/90 via-[#0fab73]/85 to-[#124c41]/85 shadow-[0_4px_40px_-8px_rgba(63,232,161,0.13)] transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-white font-orbitron flex items-center gap-2 text-lg drop-shadow-md">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-100" />
            </div>
            <span className="bg-gradient-to-r from-emerald-200 to-pastel-mint bg-clip-text text-transparent">About You</span>
          </CardTitle>
          <CardDescription className="text-emerald-100 text-base font-inter font-normal drop-shadow-sm">
            Tell us about yourself to get better job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Describe your experience, skills, career goals, and what kind of opportunities you're looking for..."
            rows={4}
            className="min-h-[100px] border-2 border-white/30 text-white placeholder-white/70 font-inter focus-visible:border-emerald-200 hover:border-emerald-300 text-base resize-none bg-black/70 shadow-inner"
          />
          <Button onClick={handleSaveBio} disabled={saving} className="font-inter bg-white text-emerald-700 hover:bg-gray-100 font-bold text-xs px-4 py-2 h-9 rounded-lg shadow">
            {saving ? 'Saving...' : 'Save Bio'}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default BioSection;
