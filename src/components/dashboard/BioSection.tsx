
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

  // Update local bio state when userProfile changes
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
      console.error('Error saving bio:', error);
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
    return <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
        <CardContent className="p-4">
          <div className="text-white text-xs">Loading...</div>
        </CardContent>
      </Card>;
  }

  return <Card className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 border-2 border-green-400 shadow-2xl shadow-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white font-inter flex items-center gap-2 text-base">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          About You
        </CardTitle>
        <CardDescription className="text-green-100 font-inter text-sm">
          Tell us about yourself to get better job recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your experience, skills, career goals, and what kind of opportunities you're looking for..." rows={4} className="min-h-[100px] border-2 border-white/20 text-white placeholder-white/70 font-inter focus-visible:border-white/40 hover:border-white/30 text-sm resize-none bg-gray-900" />
        <Button onClick={handleSaveBio} disabled={saving} className="font-inter bg-white text-green-600 hover:bg-gray-100 font-medium text-xs px-3 py-1 h-8">
          {saving ? 'Saving...' : 'Save Bio'}
        </Button>
      </CardContent>
    </Card>;
};

export default BioSection;
