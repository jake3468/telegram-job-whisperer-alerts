
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, FileText } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserProfileUpdateData } from '@/types/userProfile';
import { Layout } from '@/components/Layout';
import PaymentHistoryModal from '@/components/PaymentHistoryModal';
import SubscriptionStatusCard from '@/components/SubscriptionStatusCard';

export default function Profile() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { userProfile, loading, error, updateUserProfile } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
  });

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  const handleSubmit = async () => {
    if (!userProfile) return;

    setIsUpdating(true);
    const updates: UserProfileUpdateData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      bio: formData.bio,
    };

    const { error } = await updateUserProfile(updates);

    if (error) {
      console.error('Profile update failed:', error);
      alert(`Profile update failed: ${error}`);
    } else {
      alert('Profile updated successfully!');
    }

    setIsUpdating(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
      <div className="text-fuchsia-900 text-xs">Loading...</div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-pastel-mint via-pastel-lavender to-pastel-peach flex items-center justify-center">
      <div className="text-rose-500 text-xs">Error: {error}</div>
    </div>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-semibold mb-6">Your Profile</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed here. Use your account settings.
                  </p>
                </div>
                <Button onClick={handleSubmit} disabled={isUpdating} className="w-full">
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Add Payment History and Subscription Status Cards */}
            <div className="space-y-6">
              <PaymentHistoryModal />
              <SubscriptionStatusCard />
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Professional Bio
              </CardTitle>
              <CardDescription>
                Tell us about your professional background, skills, and career goals. This helps us provide better job matches and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write about your professional experience, skills, achievements, and career aspirations..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={isUpdating}
                  rows={6}
                  className="resize-none"
                />
                <Button onClick={handleSubmit} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Bio'}
                </Button>
              </div>
            </CardContent>
          </Card>

      </div>
    </Layout>
  );
}
