
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

const BioSection = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBio = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('bio')
          .eq('clerk_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching bio:', error);
        } else if (data?.bio) {
          setBio(data.bio);
        }
      } catch (error) {
        console.error('Error fetching user bio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBio();
  }, [user]);

  const handleSaveBio = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio })
        .eq('clerk_id', user.id);

      if (error) throw error;

      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving bio:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your bio.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="text-white">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white font-inter flex items-center gap-2">
          <User className="w-5 h-5" />
          About You
        </CardTitle>
        <CardDescription className="text-gray-400 font-inter">
          Tell us about yourself to get better job recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Describe your experience, skills, career goals, and what kind of opportunities you're looking for..."
          className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder-gray-400 font-inter"
          rows={6}
        />
        <Button
          onClick={handleSaveBio}
          disabled={saving}
          className="font-inter"
        >
          {saving ? 'Saving...' : 'Save Bio'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BioSection;
