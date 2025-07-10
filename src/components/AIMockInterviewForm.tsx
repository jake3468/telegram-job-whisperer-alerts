import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle } from "lucide-react";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
interface FormData {
  countryCode: string;
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

// Country codes with names
const countryCodes = [
  { code: "1", country: "United States", flag: "🇺🇸" },
  { code: "44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "91", country: "India", flag: "🇮🇳" },
  { code: "86", country: "China", flag: "🇨🇳" },
  { code: "49", country: "Germany", flag: "🇩🇪" },
  { code: "33", country: "France", flag: "🇫🇷" },
  { code: "39", country: "Italy", flag: "🇮🇹" },
  { code: "34", country: "Spain", flag: "🇪🇸" },
  { code: "81", country: "Japan", flag: "🇯🇵" },
  { code: "82", country: "South Korea", flag: "🇰🇷" },
  { code: "61", country: "Australia", flag: "🇦🇺" },
  { code: "55", country: "Brazil", flag: "🇧🇷" },
  { code: "52", country: "Mexico", flag: "🇲🇽" },
  { code: "7", country: "Russia", flag: "🇷🇺" },
  { code: "90", country: "Turkey", flag: "🇹🇷" },
  { code: "966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "971", country: "UAE", flag: "🇦🇪" },
  { code: "65", country: "Singapore", flag: "🇸🇬" },
  { code: "60", country: "Malaysia", flag: "🇲🇾" },
  { code: "66", country: "Thailand", flag: "🇹🇭" },
  { code: "84", country: "Vietnam", flag: "🇻🇳" },
  { code: "62", country: "Indonesia", flag: "🇮🇩" },
  { code: "63", country: "Philippines", flag: "🇵🇭" },
  { code: "27", country: "South Africa", flag: "🇿🇦" },
  { code: "20", country: "Egypt", flag: "🇪🇬" },
  { code: "234", country: "Nigeria", flag: "🇳🇬" },
  { code: "254", country: "Kenya", flag: "🇰🇪" },
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
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useCachedUserProfile();
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
            <div className="flex">
              <div className="flex items-center bg-gray-800 border border-purple-300 rounded-l-lg px-3">
                <span className="text-white text-sm font-medium">+</span>
              </div>
              <Select value={formData.countryCode} onValueChange={(value) => handleInputChange("countryCode", value)}>
                <SelectTrigger className="bg-gray-800 border-purple-300 text-white w-[200px] rounded-none border-l-0 border-r-0 focus:border-purple-500 focus:ring-purple-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                  {countryCodes.map((country) => (
                    <SelectItem 
                      key={country.code} 
                      value={country.code}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                        <span className="text-gray-300">{country.country}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="bg-gray-800 border-purple-300 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-l-none flex-1" 
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