import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AIInterviewCreditsDisplay } from './AIInterviewCreditsDisplay';
import { useAIInterviewCredits } from '@/hooks/useAIInterviewCredits';
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
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const { remainingCredits, refetch: refetchCredits } = useAIInterviewCredits();
  
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    companyName: '',
    jobTitle: '',
    jobDescription: ''
  });

  // Update form data when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        companyName: prefillData.companyName || prev.companyName,
        jobTitle: prefillData.jobTitle || prev.jobTitle,
        jobDescription: prefillData.jobDescription || prev.jobDescription
      }));
    }
  }, [prefillData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'ready' | 'refreshing' | 'expired' | 'error'>('ready');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastStatusUpdate, setLastStatusUpdate] = useState<number>(0);

  // Improved session status update with longer minimum display time
  const updateSessionStatus = useCallback((status: typeof sessionStatus, message: string = '') => {
    const now = Date.now();
    
    // Only update if we're not in a brief display period (increased to 3 seconds)
    if (now - lastStatusUpdate > 3000) {
      setSessionStatus(status);
      setStatusMessage(message);
      setLastStatusUpdate(now);
    }
  }, [lastStatusUpdate]);

  // Reduced frequency session monitoring (every 2 minutes instead of 30 seconds)
  useEffect(() => {
    if (!sessionManager) return;

    const checkSession = () => {
      // Only show status if there's actually an issue
      if (!sessionManager.isReady) {
        updateSessionStatus('refreshing', 'Initializing session...');
      } else if (!sessionManager.isTokenValid()) {
        // Check if token is about to expire (within 1 minute)
        const stats = sessionManager.sessionStats;
        const timeSinceLastRefresh = Date.now() - (stats?.lastActivity || 0);
        
        // Only show expired if it's been more than 1 minute since last activity
        if (timeSinceLastRefresh > 60 * 1000) {
          updateSessionStatus('expired', 'Session expired');
        } else {
          // Silently refresh if within 1 minute
          sessionManager.refreshToken(true);
        }
      } else {
        updateSessionStatus('ready', '');
      }
    };

    // Check immediately
    checkSession();

    // Check every 2 minutes instead of 30 seconds
    const interval = setInterval(checkSession, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sessionManager, updateSessionStatus]);

  // Proactive token refresh with debouncing
  const refreshTokenDebounced = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          if (sessionManager?.refreshToken) {
            try {
              await sessionManager.refreshToken(false); // Silent refresh
            } catch (error) {
              console.error('[AIMockInterviewForm] Proactive token refresh failed:', error);
            }
          }
        }, 1000);
      };
    })(),
    [sessionManager]
  );

  // Enhanced token validation with proactive refresh
  const ensureTokenValid = useCallback(async (): Promise<boolean> => {
    if (!sessionManager) {
      throw new Error('Session manager not available');
    }

    try {
      // Pre-flight token check - this will refresh if needed
      const token = await sessionManager.ensureTokenForOperation();
      
      if (!token) {
        // If token refresh fails, try automatic page refresh
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        updateSessionStatus('expired', 'Session expired - refreshing page...');
        return false;
      }

      updateSessionStatus('ready', '');
      return true;
    } catch (error) {
      console.error('[AIMockInterviewForm] Token validation failed:', error);
      updateSessionStatus('error', 'Authentication error - please refresh the page');
      return false;
    }
  }, [sessionManager, updateSessionStatus]);

  // Handle form input changes with proactive token refresh
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update activity when user types
    if (sessionManager?.updateActivity) {
      sessionManager.updateActivity();
    }

    // Proactive token refresh when user starts typing (debounced)
    refreshTokenDebounced();
  }, [sessionManager, refreshTokenDebounced]);

  // Enhanced form submission with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !user || !userProfile) {
      toast({
        title: "Error",
        description: "Please wait for the page to load completely.",
        variant: "destructive",
      });
      return;
    }

    if (remainingCredits <= 0) {
      toast({
        title: "No Credits Available",
        description: "You don't have any interview credits remaining. Please purchase more credits to continue.",
        variant: "destructive",
      });
      return;
    }

    // Updated validation to include job description as required with minimum 50 characters
    if (!formData.phoneNumber || !formData.companyName || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.jobDescription.length < 50) {
      toast({
        title: "Job Description Too Short",
        description: "Please provide a job description with at least 50 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    updateSessionStatus('refreshing', 'Validating session...');

    try {
      // Ensure token is valid before submission with proactive refresh
      const tokenValid = await ensureTokenValid();
      if (!tokenValid) {
        return;
      }

      updateSessionStatus('ready', 'Submitting request...');

      // Submit the form
      const result = await makeAuthenticatedRequest(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Check for existing requests with same phone number
        const { data: existingRequests } = await supabase
          .from('grace_interview_requests')
          .select('id')
          .eq('user_id', userProfile.id)
          .eq('phone_number', formData.phoneNumber)
          .eq('status', 'pending');

        // If there are existing requests, we can still proceed (allow duplicates)
        const { data, error } = await supabase
          .from('grace_interview_requests')
          .insert({
            user_id: userProfile.id,
            phone_number: formData.phoneNumber,
            company_name: formData.companyName,
            job_title: formData.jobTitle,
            job_description: formData.jobDescription || '',
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }, {
        operationType: 'interview_request_submission',
        maxRetries: 2,
        silentRetry: true
      });

      // Success
      toast({
        title: "Request Submitted Successfully!",
        description: "Grace will call you within the next 2 minutes. Please keep your phone nearby.",
        duration: 8000,
      });

      // Reset form
      setFormData({
        phoneNumber: '',
        companyName: '',
        jobTitle: '',
        jobDescription: ''
      });

      // Refresh credits
      await refetchCredits();
      
      updateSessionStatus('ready', 'Request submitted successfully!');
      
    } catch (error: any) {
      console.error('[AIMockInterviewForm] Submission error:', error);
      
      // Better error handling
      let errorMessage = 'Please try again';
      
      if (error?.message?.includes('JWT') || error?.message?.includes('expired')) {
        errorMessage = 'Session expired. Refreshing page...';
        updateSessionStatus('expired', errorMessage);
        // Auto-refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        updateSessionStatus('error', errorMessage);
      } else {
        updateSessionStatus('error', errorMessage);
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      
      // Clear status message after 5 seconds (increased from 3)
      setTimeout(() => {
        updateSessionStatus('ready', '');
      }, 5000);
    }
  };

  // Show session status only when there's an issue or actively processing
  const showSessionStatus = sessionStatus !== 'ready' || statusMessage;

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      <AIInterviewCreditsDisplay />

      {/* Session Status - Only show when relevant */}
      {showSessionStatus && (
        <div className={`p-3 rounded-lg border ${
          sessionStatus === 'expired' || sessionStatus === 'error' 
            ? 'border-red-500/30 bg-red-500/10' 
            : 'border-blue-500/30 bg-blue-500/10'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            {sessionStatus === 'refreshing' && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
            )}
            {sessionStatus === 'expired' && <AlertCircle className="h-4 w-4 text-red-400" />}
            {sessionStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
            {statusMessage && (
              <span className={
                sessionStatus === 'expired' || sessionStatus === 'error' 
                  ? 'text-red-400' 
                  : 'text-blue-400'
              }>
                {statusMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Form wrapped in white container */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-300">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">
              Phone Number *
            </Label>
            <div className="phone-input-container">
              <PhoneInput
                country={'us'}
                value={formData.phoneNumber}
                onChange={(value) => handleInputChange('phoneNumber', value)}
                inputStyle={{
                  width: '100%',
                  height: '44px',
                  fontSize: '16px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#ffffff',
                  paddingLeft: '48px'
                }}
                buttonStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #4b5563',
                  borderRadius: '8px 0 0 8px'
                }}
                dropdownStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #4b5563',
                  color: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Instructional text */}
          <div className="py-2">
            <p className="text-gray-600 text-sm">
              Enter below the company, job title, and description for the role you want a mock interview for.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-gray-700 font-medium">
              Company Name *
            </Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
              placeholder="e.g., Microsoft"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-gray-700 font-medium">
              Job Title *
            </Label>
            <Input
              id="jobTitle"
              type="text"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="text-gray-700 font-medium">
              Job Description *
            </Label>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => handleInputChange('jobDescription', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500 min-h-[100px] resize-none"
              placeholder="Please paste the job description here (minimum 50 characters required)..."
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.jobDescription.length}/50 characters minimum
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || remainingCredits <= 0 || sessionStatus === 'expired'}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call My Phone Now
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIMockInterviewForm;
