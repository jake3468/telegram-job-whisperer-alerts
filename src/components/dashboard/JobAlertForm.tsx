
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
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countries } from '@/data/countries';
import { useCachedJobAlertsData } from '@/hooks/useCachedJobAlertsData';

interface JobAlert {
  id: string;
  country: string;
  country_name?: string;
  location: string;
  job_title: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  alert_frequency: string;
  preferred_time: string;
  timezone: string;
}

interface JobAlertFormProps {
  userTimezone: string;
  editingAlert: JobAlert | null;
  onSubmit: () => void;
  onCancel: () => void;
  currentAlertCount: number;
  maxAlerts: number;
  updateActivity?: () => void;
}

const JobAlertForm = ({ userTimezone, editingAlert, onSubmit, onCancel, currentAlertCount, maxAlerts, updateActivity }: JobAlertFormProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const { executeWithRetry, optimisticAdd, isAuthReady } = useCachedJobAlertsData();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    country_name: '',
    location: '',
    job_title: '',
    job_type: 'full-time' as JobAlert['job_type'],
    alert_frequency: 'daily',
    preferred_time: '09:00',
    timezone: userTimezone
  });

  useEffect(() => {
    if (editingAlert) {
      setFormData({
        country: editingAlert.country,
        country_name: editingAlert.country_name || '',
        location: editingAlert.location,
        job_title: editingAlert.job_title,
        job_type: editingAlert.job_type,
        alert_frequency: editingAlert.alert_frequency,
        preferred_time: editingAlert.preferred_time,
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
    updateActivity?.();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create job alerts.",
        variant: "destructive"
      });
      return;
    }

    // Check alert limit for new alerts
    if (!editingAlert && currentAlertCount >= maxAlerts) {
      toast({
        title: "Alert limit reached",
        description: `You can only create up to ${maxAlerts} job alerts. Please delete an existing alert to create a new one.`,
        variant: "destructive"
      });
      return;
    }

    // Wait for authentication to be ready
    if (!isAuthReady) {
      toast({
        title: "Please wait",
        description: "Authentication is loading, please try again in a moment.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    setLoading(true);
    
    try {
      const result = await executeWithRetry(
        async () => {
          // Get the user's profile ID
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .maybeSingle();

          if (userError) {
            console.error('User fetch error:', userError);
            throw new Error('Authentication failed. Please try signing in again.');
          }
          
          if (!userData) {
            throw new Error('User profile not found. Please try refreshing the page.');
          }

          // Get the user_profile record
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('id')
            .eq('user_id', userData.id)
            .maybeSingle();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw new Error('Profile data not found. Please try refreshing the page.');
          }
          
          if (!profileData) {
            throw new Error('User profile not found. Please try refreshing the page.');
          }

          if (editingAlert) {
            // Update existing alert
            const { error } = await supabase
              .from('job_alerts')
              .update({
                country: formData.country.toLowerCase(),
                country_name: formData.country_name,
                location: formData.location,
                job_title: formData.job_title,
                job_type: formData.job_type,
                alert_frequency: formData.alert_frequency,
                preferred_time: formData.preferred_time,
                timezone: formData.timezone
              })
              .eq('id', editingAlert.id);

            if (error) {
              console.error('Update error:', error);
              throw new Error('Failed to update alert. Please try again.');
            }
            
            return { type: 'update' };
          } else {
            // Create new alert
            const newAlertData = {
              user_id: profileData.id,
              country: formData.country.toLowerCase(),
              country_name: formData.country_name,
              location: formData.location,
              job_title: formData.job_title,
              job_type: formData.job_type,
              alert_frequency: formData.alert_frequency,
              preferred_time: formData.preferred_time,
              timezone: formData.timezone
            };

            const { data, error } = await supabase
              .from('job_alerts')
              .insert(newAlertData)
              .select()
              .single();

            if (error) {
              console.error('Insert error:', error);
              if (error.message && error.message.includes('Maximum of 3 job alerts allowed')) {
                throw new Error('ALERT_LIMIT_REACHED');
              }
              throw new Error('Failed to create alert. Please try again.');
            }

            return { type: 'create', data };
          }
        },
        5, // Increased retry attempts
        editingAlert ? 'Updating job alert' : 'Creating job alert'
      );

      // Handle success
      if (result.type === 'update') {
        toast({
          title: "Success",
          description: "Job alert updated successfully.",
        });
      } else {
        // Add optimistic update
        if (result.data) {
          optimisticAdd(result.data);
        }
        
        toast({
          title: "Success",
          description: "Job alert created successfully.",
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'ALERT_LIMIT_REACHED') {
          toast({
            title: "Alert limit reached",
            description: `You can only create up to ${maxAlerts} job alerts. Please delete an existing alert to create a new one.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Unable to save",
            description: error.message || "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Unable to save",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    updateActivity?.();
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryChange = (countryCode: string, countryName: string) => {
    updateActivity?.();
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      country_name: countryName
    }));
  };

  const getCountryDisplayValue = (countryValue: string) => {
    const country = countries.find(c => c.name === countryValue || c.code === countryValue);
    return country ? `${country.name} (${country.code})` : countryValue;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3" onClick={updateActivity} onKeyDown={updateActivity}>
      {/* Alert limit warning */}
      {!editingAlert && currentAlertCount >= maxAlerts - 1 && (
        <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-2 mb-3">
          <p className="text-yellow-200 text-xs">
            {currentAlertCount === maxAlerts - 1 
              ? `You're creating your last alert (${currentAlertCount + 1}/${maxAlerts}).`
              : `You have reached the maximum limit of ${maxAlerts} alerts.`
            }
          </p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        <div className="space-y-1">
          <Label htmlFor="country" className="text-white font-inter font-medium text-xs">Country</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                className="w-full justify-between border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-xs h-8"
              >
                {formData.country
                  ? getCountryDisplayValue(formData.country)
                  : "Select country..."}
                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 z-50" align="start">
              <Command className="bg-gray-800 border-gray-600">
                <CommandInput placeholder="Search country..." className="text-white text-xs" />
                <CommandList>
                  <CommandEmpty className="text-gray-300 text-xs">No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                       <CommandItem
                         key={country.code}
                         value={`${country.name} ${country.code}`}
                         onSelect={() => {
                           handleCountryChange(country.code, country.name);
                           setCountryOpen(false);
                         }}
                         className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs"
                       >
                         <Check
                           className={cn(
                             "mr-2 h-3 w-3",
                             formData.country === country.code ? "opacity-100" : "opacity-0"
                           )}
                         />
                         {country.name} ({country.code.toUpperCase()})
                       </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label htmlFor="location" className="text-white font-inter font-medium text-xs">Location</Label>
          <Input 
            id="location" 
            value={formData.location} 
            onChange={(e) => handleInputChange('location', e.target.value)} 
            placeholder="e.g., New York, NY" 
            required 
            className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-xs h-8"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="job_title" className="text-white font-inter font-medium text-xs">Job Title</Label>
          <Input 
            id="job_title" 
            value={formData.job_title} 
            onChange={(e) => handleInputChange('job_title', e.target.value)} 
            placeholder="e.g., Software Engineer" 
            required 
            className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-xs h-8"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="job_type" className="text-white font-inter font-medium text-xs">Job Type</Label>
          <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
            <SelectTrigger className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 backdrop-blur-sm z-50">
              <SelectItem value="full-time" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs">Full-time</SelectItem>
              <SelectItem value="part-time" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs">Part-time</SelectItem>
              <SelectItem value="contract" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs">Contract</SelectItem>
              <SelectItem value="intern" className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="alert_frequency" className="text-white font-inter font-medium text-xs">Alert Frequency</Label>
          <Input 
            id="alert_frequency" 
            value="Daily" 
            readOnly
            disabled
            className="border-2 border-gray-500 text-white font-inter bg-orange-950 text-xs h-8 cursor-not-allowed opacity-75"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="preferred_time" className="text-white font-inter font-medium text-xs">Preferred Time</Label>
          <Select value={formData.preferred_time} onValueChange={(value) => handleInputChange('preferred_time', value)}>
            <SelectTrigger className="border-2 border-gray-500 text-white placeholder-gray-300 font-inter focus-visible:border-pastel-blue hover:border-gray-400 bg-orange-950 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 max-h-48 backdrop-blur-sm z-50">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} className="text-white hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="timezone" className="text-white font-inter font-medium text-xs">Timezone</Label>
          <Input 
            id="timezone" 
            value={formData.timezone} 
            readOnly
            placeholder="Auto-detected" 
            className="border-2 border-gray-500 text-white font-inter bg-orange-950 text-xs h-8 cursor-not-allowed opacity-75"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 sticky bottom-0 bg-gradient-to-br from-orange-900/95 via-[#3c1c01]/90 to-[#2b1605]/95 pb-2">
        <Button 
          type="submit" 
          disabled={loading || submitting || (!editingAlert && currentAlertCount >= maxAlerts)} 
          className="w-full font-inter bg-pastel-lavender hover:bg-pastel-lavender/80 text-black font-medium text-xs px-3 py-2 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            editingAlert ? 'Update Alert' : 'Create Alert'
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={submitting}
          className="w-full font-inter border-gray-500 hover:border-gray-400 text-gray-950 bg-pastel-peach text-xs px-3 py-2 h-8"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default JobAlertForm;
