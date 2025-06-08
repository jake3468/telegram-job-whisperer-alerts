import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface JobAlert {
  id: string;
  country: string;
  location: string;
  job_title: string;
  job_type: 'Remote' | 'On-site' | 'Hybrid';
  alert_frequency: string;
  preferred_time: string;
  max_alerts_per_day: number;
  timezone: string;
}
interface JobAlertFormProps {
  userTimezone: string;
  editingAlert: JobAlert | null;
  onSubmit: () => void;
  onCancel: () => void;
}
const JobAlertForm = ({
  userTimezone,
  editingAlert,
  onSubmit,
  onCancel
}: JobAlertFormProps) => {
  const {
    user
  } = useUser();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    location: '',
    job_title: '',
    job_type: 'Remote' as 'Remote' | 'On-site' | 'Hybrid',
    alert_frequency: 'Daily',
    preferred_time: '09:00',
    max_alerts_per_day: 5,
    timezone: userTimezone
  });
  useEffect(() => {
    if (editingAlert) {
      setFormData({
        country: editingAlert.country,
        location: editingAlert.location,
        job_title: editingAlert.job_title,
        job_type: editingAlert.job_type,
        alert_frequency: 'Daily',
        // Always set to Daily
        preferred_time: editingAlert.preferred_time,
        max_alerts_per_day: editingAlert.max_alerts_per_day,
        timezone: editingAlert.timezone
      });
    }
  }, [editingAlert]);
  const timeOptions = Array.from({
    length: 24
  }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // First, get the user's database ID
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('id').eq('clerk_id', user.id).single();
      if (userError) throw userError;
      if (editingAlert) {
        // Update existing alert
        const {
          error
        } = await supabase.from('job_alerts').update({
          ...formData,
          user_id: userData.id
        }).eq('id', editingAlert.id);
        if (error) throw error;
        toast({
          title: "Alert updated",
          description: "Job alert has been updated successfully."
        });
      } else {
        // Create new alert
        const {
          error
        } = await supabase.from('job_alerts').insert({
          ...formData,
          user_id: userData.id
        });
        if (error) throw error;
        toast({
          title: "Alert created",
          description: "Job alert has been created successfully."
        });
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving job alert:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving the job alert.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country" className="text-white font-inter font-medium mb-2 block">Country</Label>
          <Input id="country" value={formData.country} onChange={e => handleInputChange('country', e.target.value)} placeholder="e.g., United States" required className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950" />
        </div>

        <div>
          <Label htmlFor="location" className="text-white font-inter font-medium mb-2 block">Location</Label>
          <Input id="location" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="e.g., New York, NY" required className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950" />
        </div>

        <div>
          <Label htmlFor="job_title" className="text-white font-inter font-medium mb-2 block">Job Title</Label>
          <Input id="job_title" value={formData.job_title} onChange={e => handleInputChange('job_title', e.target.value)} placeholder="e.g., Software Engineer" required className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950" />
        </div>

        <div>
          <Label htmlFor="job_type" className="text-white font-inter font-medium mb-2 block">Job Type</Label>
          <Select value={formData.job_type} onValueChange={value => handleInputChange('job_type', value)}>
            <SelectTrigger className="bg-gray-700/70 border-2 border-gray-500 text-white font-inter focus:border-pastel-blue hover:border-gray-400 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 backdrop-blur-sm">
              <SelectItem value="Remote" className="text-white hover:bg-gray-700 focus:bg-gray-700">Remote</SelectItem>
              <SelectItem value="On-site" className="text-white hover:bg-gray-700 focus:bg-gray-700">On-site</SelectItem>
              <SelectItem value="Hybrid" className="text-white hover:bg-gray-700 focus:bg-gray-700">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="alert_frequency" className="text-white font-inter font-medium mb-2 block">Alert Frequency</Label>
          <Select value={formData.alert_frequency} onValueChange={value => handleInputChange('alert_frequency', value)}>
            <SelectTrigger className="bg-gray-700/70 border-2 border-gray-500 text-white font-inter focus:border-pastel-blue hover:border-gray-400 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 backdrop-blur-sm">
              <SelectItem value="Daily" className="text-white hover:bg-gray-700 focus:bg-gray-700">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="preferred_time" className="text-white font-inter font-medium mb-2 block">Preferred Time</Label>
          <Select value={formData.preferred_time} onValueChange={value => handleInputChange('preferred_time', value)}>
            <SelectTrigger className="bg-gray-700/70 border-2 border-gray-500 text-white font-inter focus:border-pastel-blue hover:border-gray-400 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 max-h-48 backdrop-blur-sm">
              {timeOptions.map(time => <SelectItem key={time} value={time} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                  {time}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="max_alerts" className="text-white font-inter font-medium mb-2 block">Max Alerts Per Day</Label>
          <Input id="max_alerts" type="number" min="1" max="50" value={formData.max_alerts_per_day} onChange={e => handleInputChange('max_alerts_per_day', parseInt(e.target.value) || 1)} className="border-2 border-gray-500 text-white font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-slate-950" />
        </div>

        <div>
          <Label htmlFor="timezone" className="text-white font-inter font-medium mb-2 block">Timezone</Label>
          <Input id="timezone" value={formData.timezone} onChange={e => handleInputChange('timezone', e.target.value)} placeholder="Auto-detected" className="border-2 border-gray-500 text-white font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-zinc-950" />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="font-inter bg-pastel-lavender hover:bg-pastel-lavender/80 text-black font-medium">
          {loading ? 'Saving...' : editingAlert ? 'Update Alert' : 'Create Alert'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="font-inter border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:border-gray-400">
          Cancel
        </Button>
      </div>
    </form>;
};
export default JobAlertForm;