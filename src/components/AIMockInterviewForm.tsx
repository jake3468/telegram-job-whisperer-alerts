import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import { useCachedUserProfile } from "@/hooks/useCachedUserProfile";
import { useCachedUserCompletionStatus } from "@/hooks/useCachedUserCompletionStatus";
import { useCachedGraceInterviewRequests } from "@/hooks/useCachedGraceInterviewRequests";
import { useAIInterviewCredits } from "@/hooks/useAIInterviewCredits";
import { ProfileCompletionWarning } from "@/components/ProfileCompletionWarning";
import { AIInterviewCreditsDisplay } from "@/components/AIInterviewCreditsDisplay";
import { AIInterviewPricingModal } from "@/components/AIInterviewPricingModal";
import { useEnterpriseAPIClient } from "@/hooks/useEnterpriseAPIClient";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface FormData {
  phoneNumber: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

interface AIMockInterviewFormProps {
  prefillData?: {
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
  };
  sessionManager?: any;
}

const AIMockInterviewForm = ({ prefillData, sessionManager }: AIMockInterviewFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: "",
    companyName: "",
    jobTitle: "",
    jobDescription: ""
  });
  
  // Initialize enterprise API client for secure, token-aware requests
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();

  // Auto-populate form data if prefillData is provided
  useEffect(() => {
    if (prefillData?.companyName || prefillData?.jobTitle || prefillData?.jobDescription) {
      setFormData(prev => ({
        ...prev,
        companyName: prefillData.companyName || prev.companyName,
        jobTitle: prefillData.jobTitle || prev.jobTitle,
        jobDescription: prefillData.jobDescription || prev.jobDescription
      }));
    }
  }, [prefillData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'refreshing' | 'expired' | 'unknown'>('unknown');
  
  const { toast } = useToast();
  const { userProfile, loading: profileLoading } = useCachedUserProfile();
  const { hasResume, hasBio, loading: completionLoading } = useCachedUserCompletionStatus();
  const { optimisticAdd } = useCachedGraceInterviewRequests();
  const { credits, hasCredits, useCredit, refetch: refetchCredits, isLoading: creditsLoading } = useAIInterviewCredits();

  // Proactive token management
  useEffect(() => {
    const checkTokenStatus = async () => {
      if (sessionManager?.isTokenValid) {
        const isValid = sessionManager.isTokenValid();
        setTokenStatus(isValid ? 'valid' : 'expired');
        
        // If token is expired or close to expiry, refresh it proactively
        if (!isValid && sessionManager.refreshToken) {
          setIsRefreshingToken(true);
          setTokenStatus('refreshing');
          
          try {
            await sessionManager.refreshToken(true);
            setTokenStatus('valid');
            console.log('[AIMockInterviewForm] Token refreshed proactively');
          } catch (error) {
            console.error('[AIMockInterviewForm] Proactive token refresh failed:', error);
            setTokenStatus('expired');
          } finally {
            setIsRefreshingToken(false);
          }
        }
      }
    };

    // Check token status on mount and periodically
    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [sessionManager]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePhoneNumber = (phone: string) => {
    return phone && phone.length >= 8;
  };

  const validatePhoneNumberUniqueness = async (phoneNumber: string) => {
    // Enhanced phone number validation with proactive token management
    return await makeAuthenticatedRequest(async () => {
      // Log the operation for debugging
      console.log('[AIMockInterviewForm] Validating phone number uniqueness:', phoneNumber);
      
      // Check if phone number already exists in grace_interview_requests
      const { data: existingRequest, error } = await supabase
        .from('grace_interview_requests')
        .select('user_id, phone_number')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        console.error('[AIMockInterviewForm] Error checking phone number:', error);
        throw new Error("Failed to validate phone number");
      }

      console.log('[AIMockInterviewForm] Phone validation result:', { existingRequest, phoneNumber });

      if (existingRequest) {
        // Phone number exists, check if it belongs to the same user
        if (existingRequest.user_id !== userProfile?.id) {
          // Different user - get the email of the existing account
          const { data: existingUserProfile, error: profileError } = await supabase
            .from('user_profile')
            .select('user_id')
            .eq('id', existingRequest.user_id)
            .single();

          if (profileError) {
            console.error('[AIMockInterviewForm] Error fetching user profile:', profileError);
            throw new Error("Failed to validate phone number");
          }

          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', existingUserProfile.user_id)
            .single();

          if (userError) {
            console.error('[AIMockInterviewForm] Error fetching user email:', userError);
            throw new Error("Failed to validate phone number");
          }

          return {
            isValid: false,
            message: `This phone number is already registered with another account (${existingUser.email}). Please sign in to that account to access the AI Interview feature.`
          };
        }
      }

      return { isValid: true };
    }, {
      maxRetries: 3,
      silentRetry: true
    });
  };

  const ensureTokenValid = async () => {
    if (!sessionManager?.isTokenValid || !sessionManager?.refreshToken) {
      console.warn('[AIMockInterviewForm] Session manager not available');
      return false;
    }

    const isValid = sessionManager.isTokenValid();
    console.log('[AIMockInterviewForm] Token validity check:', isValid);
    
    if (!isValid) {
      setIsRefreshingToken(true);
      setTokenStatus('refreshing');
      
      try {
        const refreshedToken = await sessionManager.refreshToken(true);
        console.log('[AIMockInterviewForm] Token refreshed before submission:', !!refreshedToken);
        
        if (refreshedToken) {
          setTokenStatus('valid');
          return true;
        } else {
          setTokenStatus('expired');
          return false;
        }
      } catch (error) {
        console.error('[AIMockInterviewForm] Token refresh failed:', error);
        setTokenStatus('expired');
        return false;
      } finally {
        setIsRefreshingToken(false);
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AIMockInterviewForm] Form submission started');
    console.log('[AIMockInterviewForm] User profile:', userProfile);
    console.log('[AIMockInterviewForm] Form data:', formData);
    
    if (!userProfile?.id) {
      console.error('[AIMockInterviewForm] User profile not found or missing ID');
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

    // Check AI interview calls
    if (!hasCredits) {
      toast({
        title: "No Interview Calls",
        description: "You need AI interview calls to request a call. Purchase calls to continue.",
        variant: "destructive"
      });
      setIsPricingModalOpen(true);
      return;
    }

    // Validate form
    if (!formData.phoneNumber || !formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      console.error('[AIMockInterviewForm] Missing form fields');
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      console.error('[AIMockInterviewForm] Invalid phone number:', formData.phoneNumber);
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.jobDescription.length < 50) {
      console.error('[AIMockInterviewForm] Job description too short:', formData.jobDescription.length);
      toast({
        title: "Job Description Too Short",
        description: "Please provide a more detailed job description (at least 50 characters).",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure token is valid before proceeding
      const tokenValid = await ensureTokenValid();
      if (!tokenValid) {
        toast({
          title: "Session Expired",
          description: "Please refresh the page and try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // react-phone-input-2 already includes the + prefix, so we don't need to add it
      const phoneNumber = formData.phoneNumber.startsWith('+') ? formData.phoneNumber : `+${formData.phoneNumber}`;
      console.log('[AIMockInterviewForm] Formatted phone number:', phoneNumber);
      
      // Validate phone number uniqueness with enhanced error handling
      console.log('[AIMockInterviewForm] Starting phone number validation...');
      const phoneValidation = await validatePhoneNumberUniqueness(phoneNumber);
      console.log('[AIMockInterviewForm] Phone validation result:', phoneValidation);
      
      if (!phoneValidation.isValid) {
        toast({
          title: "Phone Number Already Registered",
          description: phoneValidation.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log('[AIMockInterviewForm] Inserting data:', {
        user_id: userProfile.id,
        phone_number: phoneNumber,
        company_name: formData.companyName,
        job_title: formData.jobTitle,
        job_description: formData.jobDescription
      });
      
      // Use authenticated request for database insertion
      const data = await makeAuthenticatedRequest(async () => {
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
          console.error('[AIMockInterviewForm] Supabase error:', error);
          throw error;
        }
        
        return data;
      }, {
        maxRetries: 3,
        silentRetry: true
      });
      
      console.log('[AIMockInterviewForm] Successfully inserted data:', data);
      
      // Optimistically add to cache
      if (data) {
        optimisticAdd(data);
      }

      console.log('[AIMockInterviewForm] Interview request submitted successfully. Credit will be deducted when call is made by N8N.');
      
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
      console.error('[AIMockInterviewForm] Error submitting interview request:', error);
      
      // Enhanced error handling with better user feedback
      let errorMessage = "There was an error submitting your request. Please try again.";
      
      if (error?.message?.includes("Failed to validate phone number")) {
        errorMessage = "Unable to validate phone number. Please check your connection and try again.";
      } else if (error?.message?.includes("Please try again")) {
        errorMessage = "Connection issue. Please try again.";
      } else if (error?.message?.includes("Session expired")) {
        errorMessage = "Your session has expired. Please refresh the page and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
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
      {/* Profile Completion Warning */}
      <ProfileCompletionWarning />
      
      {/* AI Interview Credits Display */}
      <AIInterviewCreditsDisplay 
        onBuyMore={() => setIsPricingModalOpen(true)} 
      />

      {/* Token Status Indicator */}
      {(isRefreshingToken || tokenStatus === 'refreshing') && (
        <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Refreshing session...</span>
        </div>
      )}

      {tokenStatus === 'expired' && (
        <div className="flex items-center justify-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" />
          <span>Session expired. Please refresh the page.</span>
        </div>
      )}

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
          <Button 
            type="submit" 
            disabled={isSubmitting || !hasCredits || creditsLoading || isRefreshingToken || tokenStatus === 'expired'} 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : isRefreshingToken ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Refreshing Session...
              </>
            ) : !hasCredits ? (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Calls to Continue
              </>
            ) : tokenStatus === 'expired' ? (
              <>
                <AlertCircle className="w-5 h-5 mr-2" />
                Session Expired - Refresh Page
              </>
            ) : (
              <>
                <Phone className="w-5 h-5 mr-2" />
                Call My Phone Now
              </>
            )}
          </Button>
          
          {!isSubmitting && hasCredits && tokenStatus === 'valid' && (
            <p className="text-center text-black text-sm mt-3">
              Grace will call you within ~1 minute of submitting
            </p>
          )}
          
          {!hasCredits && !creditsLoading && (
            <p className="text-center text-orange-600 text-sm mt-3">
              Purchase AI interview calls to request a call from Grace
            </p>
          )}

          {tokenStatus === 'expired' && (
            <p className="text-center text-red-600 text-sm mt-3">
              Your session has expired. Please refresh the page to continue.
            </p>
          )}
        </div>
      </div>
      </form>

      {/* Pricing Modal */}
      <AIInterviewPricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
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
