import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { useCachedUserCompletionStatus } from "@/hooks/useCachedUserCompletionStatus";
import { useCachedGraceInterviewRequests } from "@/hooks/useCachedGraceInterviewRequests";
import { ProfileCompletionWarning } from "@/components/ProfileCompletionWarning";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface FormData {
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

const AIMockInterviewForm = () => {
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    jobDescription: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useCachedUserProfile();
  const { hasResume, hasBio, loading: completionLoading } = useCachedUserCompletionStatus();
  const { optimisticAdd } = useCachedGraceInterviewRequests();
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const validatePhoneNumber = (phone: string) => {
    // Validate that phone number is not empty and has proper format (react-phone-input-2 handles validation)
    return phone && phone.length >= 8;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission started");
    console.log("User profile:", userProfile);
    console.log("Profile completion status:", { hasResume, hasBio });
    console.log("Form data:", formData);
    
    if (!userProfile?.id) {
      console.error("User profile not found or missing ID");
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in and try again.",
        variant: "destructive"
      });
      return;
    }

    // Check profile completion first
    if (!hasResume || !hasBio) {
      const missing = [];
      if (!hasResume) missing.push("resume");
      if (!hasBio) missing.push("bio");
      
      toast({
        title: "Complete Your Profile First",
        description: `Please add your ${missing.join(" and ")} in your profile page before requesting an interview.`,
        variant: "destructive"
      });
      return;
    }

    // Validate form
    if (!formData.phoneNumber || !formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      console.error("Missing form fields");
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      console.error("Invalid phone number:", formData.phoneNumber);
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.jobDescription.length < 50) {
      console.error("Job description too short:", formData.jobDescription.length);
      toast({
        title: "Job Description Too Short",
        description: "Please provide a more detailed job description (at least 50 characters).",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // react-phone-input-2 already includes the + prefix, so we don't need to add it
      const phoneNumber = formData.phoneNumber.startsWith('+') ? formData.phoneNumber : `+${formData.phoneNumber}`;
      
      console.log("Inserting data:", {
        user_id: userProfile.id,
        phone_number: phoneNumber,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      });
      
      const { data, error } = await supabase
        .from("grace_interview_requests")
        .insert({
          user_id: userProfile.id,
          phone_number: phoneNumber,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription
        })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Successfully inserted data:", data);
      
      // Optimistically add to cache
      if (data) {
        optimisticAdd(data);
      }
      
      setIsSubmitted(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "Grace will call you within ~1 minute. Please keep your phone ready."
      });

      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          phoneNumber: "",
          companyName: "",
          jobTitle: "",
          jobDescription: ""
        });
      }, 5000);
    } catch (error: any) {
      console.error("Error submitting interview request:", error);
      
      // Handle specific error types
      let errorMessage = "There was an error submitting your request. Please try again.";
      
      if (error?.message?.includes("JWT") || error?.message?.includes("expired")) {
        errorMessage = "Your session has expired. Please refresh the page and try again.";
      } else if (error?.message?.includes("violates row-level security")) {
        errorMessage = "Authentication error. Please refresh the page and try again.";
      } else if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
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
  
  return (
    <div className="space-y-6">
      {/* Profile Completion Warning - Uses the standard component with proper caching */}
      <ProfileCompletionWarning />

      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-purple-500/30 rounded-xl p-8 bg-white shadow-lg shadow-purple-500/20">
        <div className="space-y-6">
          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-2">
              Phone Number
            </label>
            <div className="phone-input-wrapper">
              <PhoneInput
                country={'us'}
                value={formData.phoneNumber}
                onChange={(phone) => handleInputChange("phoneNumber", phone)}
                enableSearch={true}
                searchPlaceholder="Search countries..."
                inputProps={{
                  name: 'phoneNumber',
                  required: true,
                  className: 'phone-input-field'
                }}
                containerClass="phone-input-container"
                inputClass="phone-input-field"
                buttonClass="phone-input-button"
                dropdownClass="phone-input-dropdown"
                searchClass="phone-input-search"
              />
            </div>
            <p className="text-xs text-black mt-1">
              Select your country and enter your mobile number
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
      </form>
    </div>
  );
};

// Custom styles for react-phone-input-2 to match our dark theme
const phoneInputStyles = `
  .phone-input-container {
    width: 100% !important;
  }
  
  .phone-input-field {
    width: 100% !important;
    height: 2.5rem !important;
    background-color: rgb(31 41 55) !important; /* bg-gray-800 */
    border: 1px solid rgb(55 65 81) !important; /* border-gray-700 */
    border-radius: 0.5rem !important;
    color: white !important;
    font-size: 0.875rem !important;
    padding-left: 3.5rem !important;
  }
  
  .phone-input-field:focus {
    border-color: rgb(147 51 234) !important; /* border-purple-500 */
    box-shadow: 0 0 0 1px rgb(147 51 234 / 0.2) !important;
    outline: none !important;
  }
  
  .phone-input-field::placeholder {
    color: rgb(156 163 175) !important; /* text-gray-400 */
  }
  
  .phone-input-button {
    background-color: rgb(31 41 55) !important; /* bg-gray-800 */
    border: 1px solid rgb(55 65 81) !important; /* border-gray-700 */
    border-right: none !important;
    border-radius: 0.5rem 0 0 0.5rem !important;
    padding: 0 0.75rem !important;
  }
  
  .phone-input-button:hover {
    background-color: rgb(17 24 39) !important; /* bg-gray-900 */
  }
  
  .phone-input-button:focus,
  .phone-input-button:active,
  .phone-input-button.open {
    background-color: rgb(31 41 55) !important; /* Keep dark when active */
    border-color: rgb(147 51 234) !important; /* Purple border when active */
  }
  
  .phone-input-dropdown {
    background-color: rgb(31 41 55) !important; /* bg-gray-800 */
    border: 1px solid rgb(55 65 81) !important; /* border-gray-700 */
    border-radius: 0.5rem !important;
    max-height: 200px !important;
    overflow-y: auto !important;
    z-index: 50 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
  }
  
  .phone-input-dropdown .country {
    color: white !important;
    padding: 0.5rem !important;
    font-size: 0.875rem !important;
  }
  
  .phone-input-dropdown .country .country-name {
    color: white !important;
  }
  
  .phone-input-dropdown .country .dial-code {
    color: white !important;
    font-weight: 500 !important;
  }
  
  .phone-input-dropdown .country:hover {
    background-color: rgb(55 65 81) !important; /* bg-gray-700 */
  }
  
  .phone-input-dropdown .country.highlight {
    background-color: rgb(147 51 234) !important; /* bg-purple-500 */
  }
  
  .phone-input-dropdown .country.preferred {
    background-color: rgb(17 24 39) !important; /* bg-gray-900 */
  }
  
  .phone-input-search {
    background-color: white !important; /* White background for search */
    border: 1px solid rgb(209 213 219) !important; /* border-gray-300 */
    color: black !important; /* Black text */
    padding: 0.5rem !important;
    margin: 0.5rem !important;
    border-radius: 0.375rem !important;
    width: calc(100% - 1rem) !important;
  }
  
  .phone-input-search:focus {
    border-color: rgb(147 51 234) !important; /* Purple border on focus */
    outline: none !important;
    box-shadow: 0 0 0 1px rgb(147 51 234 / 0.2) !important;
  }
  
  .phone-input-search::placeholder {
    color: rgb(107 114 128) !important; /* text-gray-500 for placeholder */
  }
  
  /* Fix for flag display */
  .phone-input-button .flag-dropdown {
    background-color: transparent !important;
  }
  
  .phone-input-button .selected-flag {
    background-color: transparent !important;
  }
  
  .phone-input-button .selected-flag:hover {
    background-color: rgb(17 24 39) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = phoneInputStyles;
  document.head.appendChild(styleElement);
}
export default AIMockInterviewForm;