
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface PersonalInfoFormProps {
  data: any;
  onChange: (data: any) => void;
}

const PersonalInfoForm = ({ data, onChange }: PersonalInfoFormProps) => {
  const handleInputChange = (field: string, value: string) => {
    onChange({
      [field]: value
    });
  };

  const handleSocialProfileAdd = () => {
    const socialProfiles = data.social_profiles || [];
    onChange({
      social_profiles: [...socialProfiles, { platform: '', url: '' }]
    });
  };

  const handleSocialProfileRemove = (index: number) => {
    const socialProfiles = data.social_profiles || [];
    onChange({
      social_profiles: socialProfiles.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSocialProfileChange = (index: number, field: string, value: string) => {
    const socialProfiles = data.social_profiles || [];
    const updated = socialProfiles.map((profile: any, i: number) => 
      i === index ? { ...profile, [field]: value } : profile
    );
    onChange({
      social_profiles: updated
    });
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-w-0">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={data.full_name || ''}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="John Doe"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0">
          <Label htmlFor="email">Professional Email *</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john.doe@email.com"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="New York, NY, USA"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0">
          <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
          <Input
            id="linkedin_url"
            value={data.linkedin_url || ''}
            onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/johndoe"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0">
          <Label htmlFor="portfolio_url">Portfolio/Website</Label>
          <Input
            id="portfolio_url"
            value={data.portfolio_url || ''}
            onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
            placeholder="https://johndoe.com"
            className="bg-zinc-800 w-full"
          />
        </div>
        
        <div className="min-w-0 lg:col-span-2">
          <Label htmlFor="github_url">GitHub Profile</Label>
          <Input
            id="github_url"
            value={data.github_url || ''}
            onChange={(e) => handleInputChange('github_url', e.target.value)}
            placeholder="https://github.com/johndoe"
            className="bg-zinc-800 w-full"
          />
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <Label className="text-lg font-medium text-gray-700">Additional Social Profiles</Label>
          <Button
            type="button"
            onClick={handleSocialProfileAdd}
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Profile
          </Button>
        </div>
        
        {(data.social_profiles || []).map((profile: any, index: number) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2">
            <Input
              value={profile.platform || ''}
              onChange={(e) => handleSocialProfileChange(index, 'platform', e.target.value)}
              placeholder="Platform (e.g., Twitter)"
              className="flex-1 min-w-0"
            />
            <Input
              value={profile.url || ''}
              onChange={(e) => handleSocialProfileChange(index, 'url', e.target.value)}
              placeholder="Profile URL"
              className="flex-1 min-w-0"
            />
            <Button
              type="button"
              onClick={() => handleSocialProfileRemove(index)}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalInfoForm;
