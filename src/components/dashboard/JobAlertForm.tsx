import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countries } from '@/data/countries';

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
  currentAlertCount: number;
  maxAlerts: number;
}

const JobAlertForm = ({ userTimezone, editingAlert, onSubmit, onCancel, currentAlertCount, maxAlerts }: JobAlertFormProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
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
        alert_frequency: 'Daily', // Always set to Daily
        preferred_time: editingAlert.preferred_time,
        max_alerts_per_day: editingAlert.max_alerts_per_day,
        timezone: editingAlert.timezone
      });
    }
  }, [editingAlert]);

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check alert limit for new alerts (not for editing existing ones)
    if (!editingAlert && currentAlertCount >= maxAlerts) {
      toast({
        title: "Alert limit reached",
        description: `You can only create up to ${maxAlerts} job alerts. Please delete an existing alert to create a new one.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get the user's profile ID (not the users table ID)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) throw userError;

      // Get the user_profile record to use its ID as the foreign key
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError) throw profileError;

      // Store only the country code instead of the full country name
      const countryToStore = countries.find(c => c.name === formData.country)?.code || formData.country;

      if (editingAlert) {
        // Update existing alert - use profile ID
        const { error } = await supabase
          .from('job_alerts')
          .update({
            ...formData,
            country: countryToStore,
            user_id: profileData.id // Use profile ID, not user ID
          })
          .eq('id', editingAlert.id);

        if (error) throw error;

        toast({
          title: "Alert updated",
          description: "Job alert has been updated successfully.",
        });
      } else {
        // Create new alert - use profile ID
        const { error } = await supabase
          .from('job_alerts')
          .insert({
            ...formData,
            country: countryToStore,
            user_id: profileData.id // Use profile ID, not user ID
          });

        if (error) {
          // Handle the specific case of hitting the 5-alert limit
          if (error.message && error.message.includes('Maximum of 5 job alerts allowed')) {
            toast({
              title: "Alert limit reached",
              description: "You can only create up to 5 job alerts. Please delete an existing alert to create a new one.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Alert created",
          description: "Job alert has been created successfully.",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving job alert:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving the job alert.",
        variant: "destructive",
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

  const getCountryDisplayValue = (countryValue: string) => {
    const country = countries.find(c => c.name === countryValue || c.code === countryValue);
    return country ? `${country.name} (${country.code})` : countryValue;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alert limit warning for new alerts */}
      {!editingAlert && currentAlertCount >= maxAlerts - 1 && (
        <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-3 mb-4">
          <p className="text-yellow-200 text-sm">
            {currentAlertCount === maxAlerts - 1 
              ? `You're creating your last alert (${currentAlertCount + 1}/${maxAlerts}).`
              : `You have reached the maximum limit of ${maxAlerts} alerts.`
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-1">
          <Label htmlFor="country" className="text-white font-inter font-medium text-sm">Country</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                className="w-full justify-between border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9"
              >
                {formData.country
                  ? getCountryDisplayValue(formData.country)
                  : "Select country..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command className="bg-gray-800 border-gray-600">
                <CommandInput placeholder="Search country..." className="text-white" />
                <CommandList>
                  <CommandEmpty className="text-gray-300">No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={country.name}
                        onSelect={() => {
                          handleInputChange('country', country.name);
                          setCountryOpen(false);
                        }}
                        className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.country === country.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country.name} ({country.code})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label htmlFor="location" className="text-white font-inter font-medium text-sm">Location</Label>
          <Input 
            id="location" 
            value={formData.location} 
            onChange={(e) => handleInputChange('location', e.target.value)} 
            placeholder="e.g., New York, NY" 
            required 
            className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="job_title" className="text-white font-inter font-medium text-sm">Job Title</Label>
          <Input 
            id="job_title" 
            value={formData.job_title} 
            onChange={(e) => handleInputChange('job_title', e.target.value)} 
            placeholder="e.g., Software Engineer" 
            required 
            className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="job_type" className="text-white font-inter font-medium text-sm">Job Type</Label>
          <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
            <SelectTrigger className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 backdrop-blur-sm">
              <SelectItem value="Remote" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-sm">Remote</SelectItem>
              <SelectItem value="On-site" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-sm">On-site</SelectItem>
              <SelectItem value="Hybrid" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-sm">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="alert_frequency" className="text-white font-inter font-medium text-sm">Alert Frequency</Label>
          <Input 
            id="alert_frequency" 
            value="Daily"
            readOnly
            className="border-2 border-gray-500 text-white font-inter bg-orange-950 text-sm h-9 cursor-not-allowed opacity-75"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="preferred_time" className="text-white font-inter font-medium text-sm">Preferred Time</Label>
          <Select value={formData.preferred_time} onValueChange={(value) => handleInputChange('preferred_time', value)}>
            <SelectTrigger className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 max-h-48 backdrop-blur-sm">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-sm">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="max_alerts" className="text-white font-inter font-medium text-sm">Max Alerts Per Day</Label>
          <Input 
            id="max_alerts" 
            type="number" 
            min="1" 
            max="10" 
            value={formData.max_alerts_per_day} 
            onChange={(e) => handleInputChange('max_alerts_per_day', parseInt(e.target.value) || 1)} 
            className="border-2 border-gray-500 text-white font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-sm h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="timezone" className="text-white font-inter font-medium text-sm">Timezone</Label>
          <Input 
            id="timezone" 
            value={formData.timezone} 
            readOnly
            placeholder="Auto-detected" 
            className="border-2 border-gray-500 text-white font-inter bg-orange-950 text-sm h-9 cursor-not-allowed opacity-75"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
        <Button 
          type="submit" 
          disabled={loading || (!editingAlert && currentAlertCount >= maxAlerts)} 
          className="font-inter bg-pastel-lavender hover:bg-pastel-lavender/80 text-black font-medium text-sm px-4 py-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : editingAlert ? 'Update Alert' : 'Create Alert'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="font-inter border-gray-500 hover:border-gray-400 text-gray-950 bg-pastel-peach text-sm px-4 py-2 h-9"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default JobAlertForm;
