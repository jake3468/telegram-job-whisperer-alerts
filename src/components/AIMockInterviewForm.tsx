import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle } from "lucide-react";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";

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
  const { userProfile } = useCachedUserProfile();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.id) {
      toast({
        title: "Authentication Error",
        description: "Please ensure you're logged in and try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!formData.phoneNumber || !formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    if (formData.jobDescription.length < 50) {
      toast({
        title: "Job Description Too Short",
        description: "Please provide a more detailed job description (at least 50 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("grace_interview_requests")
        .insert({
          user_id: userProfile.id,
          phone_number: formData.phoneNumber,
          company_name: formData.companyName,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Request Submitted Successfully!",
        description: "Grace will call you within ~1 minute. Please keep your phone ready.",
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

    } catch (error) {
      console.error("Error submitting interview request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-400 mb-4">Request Submitted!</h3>
        <p className="text-gray-300 mb-2">
          Thank you! Grace will call you within ~1 minute.
        </p>
        <p className="text-gray-400 text-sm">
          Please keep your phone ready and answer when Grace calls.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-900/60 backdrop-blur-lg border border-gray-700/50 rounded-xl p-8">
        <div className="space-y-6">
          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number (with country code)
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 9551234567"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
              required
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
              Company Name
            </label>
            <Input
              id="companyName"
              type="text"
              placeholder="e.g., Google, Microsoft, Startup Inc."
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
              required
            />
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-2">
              Job Title
            </label>
            <Input
              id="jobTitle"
              type="text"
              placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className="bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
              required
            />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Job Description
            </label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the full job description here. Include responsibilities, requirements, and any specific skills mentioned..."
              value={formData.jobDescription}
              onChange={(e) => handleInputChange("jobDescription", e.target.value)}
              className="bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[120px] resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.jobDescription.length}/500+ characters (minimum 50 required)
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5 mr-2" />
                Call My Phone Now
              </>
            )}
          </Button>
          
          {!isSubmitting && (
            <p className="text-center text-gray-400 text-sm mt-3">
              Grace will call you within ~1 minute of submitting
            </p>
          )}
        </div>
      </div>
    </form>
  );
};

export default AIMockInterviewForm;