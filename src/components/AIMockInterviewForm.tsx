import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle, Search } from "lucide-react";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
interface FormData {
  countryCode: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

// Comprehensive country codes list
const countryCodes = [
  { code: "1", country: "US" }, { code: "1", country: "CA" }, { code: "20", country: "EG" },
  { code: "211", country: "SS" }, { code: "212", country: "MA" }, { code: "213", country: "DZ" },
  { code: "216", country: "TN" }, { code: "218", country: "LY" }, { code: "220", country: "GM" },
  { code: "221", country: "SN" }, { code: "222", country: "MR" }, { code: "223", country: "ML" },
  { code: "224", country: "GN" }, { code: "225", country: "CI" }, { code: "226", country: "BF" },
  { code: "227", country: "NE" }, { code: "228", country: "TG" }, { code: "229", country: "BJ" },
  { code: "230", country: "MU" }, { code: "231", country: "LR" }, { code: "232", country: "SL" },
  { code: "233", country: "GH" }, { code: "234", country: "NG" }, { code: "235", country: "TD" },
  { code: "236", country: "CF" }, { code: "237", country: "CM" }, { code: "238", country: "CV" },
  { code: "239", country: "ST" }, { code: "240", country: "GQ" }, { code: "241", country: "GA" },
  { code: "242", country: "CG" }, { code: "243", country: "CD" }, { code: "244", country: "AO" },
  { code: "245", country: "GW" }, { code: "246", country: "IO" }, { code: "247", country: "AC" },
  { code: "248", country: "SC" }, { code: "249", country: "SD" }, { code: "250", country: "RW" },
  { code: "251", country: "ET" }, { code: "252", country: "SO" }, { code: "253", country: "DJ" },
  { code: "254", country: "KE" }, { code: "255", country: "TZ" }, { code: "256", country: "UG" },
  { code: "257", country: "BI" }, { code: "258", country: "MZ" }, { code: "260", country: "ZM" },
  { code: "261", country: "MG" }, { code: "262", country: "RE" }, { code: "263", country: "ZW" },
  { code: "264", country: "NA" }, { code: "265", country: "MW" }, { code: "266", country: "LS" },
  { code: "267", country: "BW" }, { code: "268", country: "SZ" }, { code: "269", country: "KM" },
  { code: "290", country: "SH" }, { code: "291", country: "ER" }, { code: "297", country: "AW" },
  { code: "298", country: "FO" }, { code: "299", country: "GL" }, { code: "30", country: "GR" },
  { code: "31", country: "NL" }, { code: "32", country: "BE" }, { code: "33", country: "FR" },
  { code: "34", country: "ES" }, { code: "36", country: "HU" }, { code: "39", country: "IT" },
  { code: "40", country: "RO" }, { code: "41", country: "CH" }, { code: "43", country: "AT" },
  { code: "44", country: "GB" }, { code: "45", country: "DK" }, { code: "46", country: "SE" },
  { code: "47", country: "NO" }, { code: "48", country: "PL" }, { code: "49", country: "DE" },
  { code: "51", country: "PE" }, { code: "52", country: "MX" }, { code: "53", country: "CU" },
  { code: "54", country: "AR" }, { code: "55", country: "BR" }, { code: "56", country: "CL" },
  { code: "57", country: "CO" }, { code: "58", country: "VE" }, { code: "60", country: "MY" },
  { code: "61", country: "AU" }, { code: "62", country: "ID" }, { code: "63", country: "PH" },
  { code: "64", country: "NZ" }, { code: "65", country: "SG" }, { code: "66", country: "TH" },
  { code: "81", country: "JP" }, { code: "82", country: "KR" }, { code: "84", country: "VN" },
  { code: "86", country: "CN" }, { code: "90", country: "TR" }, { code: "91", country: "IN" },
  { code: "92", country: "PK" }, { code: "93", country: "AF" }, { code: "94", country: "LK" },
  { code: "95", country: "MM" }, { code: "98", country: "IR" }, { code: "350", country: "GI" },
  { code: "351", country: "PT" }, { code: "352", country: "LU" }, { code: "353", country: "IE" },
  { code: "354", country: "IS" }, { code: "355", country: "AL" }, { code: "356", country: "MT" },
  { code: "357", country: "CY" }, { code: "358", country: "FI" }, { code: "359", country: "BG" },
  { code: "370", country: "LT" }, { code: "371", country: "LV" }, { code: "372", country: "EE" },
  { code: "373", country: "MD" }, { code: "374", country: "AM" }, { code: "375", country: "BY" },
  { code: "376", country: "AD" }, { code: "377", country: "MC" }, { code: "378", country: "SM" },
  { code: "379", country: "VA" }, { code: "380", country: "UA" }, { code: "381", country: "RS" },
  { code: "382", country: "ME" }, { code: "383", country: "XK" }, { code: "385", country: "HR" },
  { code: "386", country: "SI" }, { code: "387", country: "BA" }, { code: "389", country: "MK" },
  { code: "420", country: "CZ" }, { code: "421", country: "SK" }, { code: "423", country: "LI" },
  { code: "500", country: "FK" }, { code: "501", country: "BZ" }, { code: "502", country: "GT" },
  { code: "503", country: "SV" }, { code: "504", country: "HN" }, { code: "505", country: "NI" },
  { code: "506", country: "CR" }, { code: "507", country: "PA" }, { code: "508", country: "PM" },
  { code: "509", country: "HT" }, { code: "590", country: "GP" }, { code: "591", country: "BO" },
  { code: "592", country: "GY" }, { code: "593", country: "EC" }, { code: "594", country: "GF" },
  { code: "595", country: "PY" }, { code: "596", country: "MQ" }, { code: "597", country: "SR" },
  { code: "598", country: "UY" }, { code: "599", country: "CW" }, { code: "670", country: "TL" },
  { code: "672", country: "AQ" }, { code: "673", country: "BN" }, { code: "674", country: "NU" },
  { code: "675", country: "PG" }, { code: "676", country: "TO" }, { code: "677", country: "SB" },
  { code: "678", country: "VU" }, { code: "679", country: "FJ" }, { code: "680", country: "PW" },
  { code: "681", country: "WF" }, { code: "682", country: "CK" }, { code: "683", country: "NR" },
  { code: "685", country: "WS" }, { code: "686", country: "KI" }, { code: "687", country: "NC" },
  { code: "688", country: "TV" }, { code: "689", country: "PF" }, { code: "690", country: "TK" },
  { code: "691", country: "FM" }, { code: "692", country: "MH" }, { code: "850", country: "KP" },
  { code: "852", country: "HK" }, { code: "853", country: "MO" }, { code: "855", country: "KH" },
  { code: "856", country: "LA" }, { code: "880", country: "BD" }, { code: "886", country: "TW" },
  { code: "960", country: "MV" }, { code: "961", country: "LB" }, { code: "962", country: "JO" },
  { code: "963", country: "SY" }, { code: "964", country: "IQ" }, { code: "965", country: "KW" },
  { code: "966", country: "SA" }, { code: "967", country: "YE" }, { code: "968", country: "OM" },
  { code: "970", country: "PS" }, { code: "971", country: "AE" }, { code: "972", country: "IL" },
  { code: "973", country: "BH" }, { code: "974", country: "QA" }, { code: "975", country: "BT" },
  { code: "976", country: "MN" }, { code: "977", country: "NP" }, { code: "992", country: "TJ" },
  { code: "993", country: "TM" }, { code: "994", country: "AZ" }, { code: "995", country: "GE" },
  { code: "996", country: "KG" }, { code: "998", country: "UZ" }
];
const AIMockInterviewForm = () => {
  const [formData, setFormData] = useState<FormData>({
    countryCode: "1",
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    jobDescription: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useCachedUserProfile();

  // Deduplicate country codes and create unique entries
  const uniqueCountryCodes = useMemo(() => {
    const seen = new Set();
    return countryCodes.filter(country => {
      const key = `${country.code}-${country.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const validatePhoneNumber = (phone: string) => {
    // Validate that phone number contains only digits and is not empty
    const phoneRegex = /^[0-9]{6,15}$/;
    return phoneRegex.test(phone);
  };

  const getFullPhoneNumber = () => {
    return `+${formData.countryCode}${formData.phoneNumber}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in and try again.",
        variant: "destructive"
      });
      return;
    }

    // Validate form
    if (!formData.phoneNumber || !formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      return;
    }
    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid mobile number (6-15 digits only).",
        variant: "destructive"
      });
      return;
    }
    if (formData.jobDescription.length < 50) {
      toast({
        title: "Job Description Too Short",
        description: "Please provide a more detailed job description (at least 50 characters).",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from("grace_interview_requests").insert({
        user_id: userProfile.id,
        phone_number: getFullPhoneNumber(),
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "Grace will call you within ~1 minute. Please keep your phone ready."
      });

      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          countryCode: "1",
          phoneNumber: "",
          companyName: "",
          jobTitle: "",
          jobDescription: ""
        });
      }, 5000);
    } catch (error) {
      console.error("Error submitting interview request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSubmitted) {
    return <div className="bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-400 mb-4">Request Submitted!</h3>
        <p className="text-gray-300 mb-2">
          Thank you! Grace will call you within ~1 minute.
        </p>
        <p className="text-gray-400 text-sm">
          Please keep your phone ready and answer when Grace calls.
        </p>
      </div>;
  }
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-purple-500/30 rounded-xl p-8 bg-white shadow-lg shadow-purple-500/20">
        <div className="space-y-6">
          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-2">
              Phone Number
            </label>
            <div className="flex rounded-lg overflow-hidden">
              <div className="flex items-center bg-gray-800 border border-gray-700 px-3 border-r-0">
                <span className="text-white text-sm font-medium">+</span>
              </div>
              <Popover open={countrySearchOpen} onOpenChange={setCountrySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countrySearchOpen}
                    className="w-[180px] justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 border-l-0 border-r-0 rounded-none"
                  >
                    {formData.countryCode ? 
                      `${formData.countryCode} (${uniqueCountryCodes.find(c => c.code === formData.countryCode)?.country || ''})` : 
                      "Select country..."
                    }
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-gray-800 border-gray-600">
                  <Command className="bg-gray-800">
                    <CommandInput 
                      placeholder="Search country..." 
                      className="bg-gray-800 text-white border-gray-700"
                    />
                    <CommandEmpty className="text-gray-400 p-4">No country found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList className="max-h-60 overflow-y-auto">
                        {uniqueCountryCodes.map((country) => (
                          <CommandItem
                            key={`${country.code}-${country.country}`}
                            value={`${country.code} ${country.country}`}
                            onSelect={() => {
                              handleInputChange("countryCode", country.code);
                              setCountrySearchOpen(false);
                            }}
                            className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                          >
                            <span className="font-mono text-sm">+{country.code}</span>
                            <span className="ml-2 text-gray-300">({country.country})</span>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input 
                id="phoneNumber" 
                type="tel" 
                placeholder="1234567890" 
                value={formData.phoneNumber} 
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  handleInputChange("phoneNumber", value);
                }}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-l-none flex-1" 
                required 
              />
            </div>
            <p className="text-xs text-black mt-1">
              Enter mobile number without spaces or dashes (e.g., 1234567890)
            </p>
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-black mb-2">
              Company Name
            </label>
            <Input id="companyName" type="text" placeholder="e.g., Google, Microsoft, Startup Inc." value={formData.companyName} onChange={e => handleInputChange("companyName", e.target.value)} className="bg-gray-800 border-purple-300 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20" required />
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-black mb-2">
              Job Title
            </label>
            <Input id="jobTitle" type="text" placeholder="e.g., Software Engineer, Product Manager, Data Scientist" value={formData.jobTitle} onChange={e => handleInputChange("jobTitle", e.target.value)} className="bg-gray-800 border-purple-300 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20" required />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-black mb-2">
              Job Description
            </label>
            <Textarea id="jobDescription" placeholder="Paste the full job description here. Include responsibilities, requirements, and any specific skills mentioned..." value={formData.jobDescription} onChange={e => handleInputChange("jobDescription", e.target.value)} className="bg-gray-800 border-purple-300 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 min-h-[120px] resize-none" required />
            <p className="text-xs text-black mt-1">
              {formData.jobDescription.length}/500+ characters (minimum 50 required)
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {isSubmitting ? <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Request...
              </> : <>
                <Phone className="w-5 h-5 mr-2" />
                Call My Phone Now
              </>}
          </Button>
          
          {!isSubmitting && <p className="text-center text-black text-sm mt-3">
              Grace will call you within ~1 minute of submitting
            </p>}
        </div>
      </div>
    </form>;
};
export default AIMockInterviewForm;