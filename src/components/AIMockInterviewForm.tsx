
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useCachedUserCompletionStatus } from '@/hooks/useCachedUserCompletionStatus';
import { useCachedAIInterviewCredits } from '@/hooks/useCachedAIInterviewCredits';
import { useEnterpriseSessionManager } from '@/hooks/useEnterpriseSessionManager';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

interface AIMockInterviewFormProps {
  prefillData?: {
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
  };
}

const AIMockInterviewForm: React.FC<AIMockInterviewFormProps> = ({ prefillData = {} }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const sessionManager = useEnterpriseSessionManager();
  
  // Use session-aware completion status
  const { hasResume, hasBio, isComplete, loading: completionLoading, refetchStatus } = useCachedUserCompletionStatus();
  const { credits, loading: creditsLoading, refetch: refetchCredits } = useCachedAIInterviewCredits();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState(prefillData.companyName || '');
  const [jobTitle, setJobTitle] = useState(prefillData.jobTitle || '');
  const [jobDescription, setJobDescription] = useState(prefillData.jobDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Monitor session state for better UX
  useEffect(() => {
    if (sessionManager?.sessionStats) {
      const stats = sessionManager.sessionStats;
      const isSessionUnstable = !stats.tokenValid || stats.failureCount > 2;
      setShowSessionWarning(isSessionUnstable);
    }
  }, [sessionManager?.sessionStats]);

  // Auto-populate form data
  useEffect(() => {
    if (prefillData.companyName) setCompanyName(prefillData.companyName);
    if (prefillData.jobTitle) setJobTitle(prefillData.jobTitle);
    if (prefillData.jobDescription) setJobDescription(prefillData.jobDescription);
  }, [prefillData]);

  const handleRefreshData = async () => {
    try {
      // Force session refresh first
      if (sessionManager?.refreshToken) {
        await sessionManager.refreshToken(true);
      }
      
      // Then refresh completion status and credits
      await Promise.all([
        refetchStatus(),
        refetchCredits()
      ]);
      
      toast({
        title: "Data refreshed",
        description: "Your profile information has been updated",
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast({
        title: "Refresh failed",
        description: "Please try again or reload the page",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive"
      });
      return;
    }

    // Enhanced session validation
    if (sessionManager && !sessionManager.isReady) {
      toast({
        title: "Session not ready",
        description: "Please wait a moment and try again",
        variant: "destructive"
      });
      return;
    }

    // Check completion status with session awareness
    if (!isComplete && !completionLoading) {
      if (!hasResume || !hasBio) {
        toast({
          title: "Profile incomplete",
          description: "Please complete your profile before scheduling an interview",
          variant: "destructive"
        });
        return;
      }
    }

    // Check credits
    if (!credits || credits.remaining_credits < 1) {
      toast({
        title: "Insufficient credits",
        description: "You need at least 1 AI interview credit to schedule an interview",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber || !companyName || !jobTitle) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user profile ID for the request
      const { data: userProfileData, error: profileError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
      });

      if (profileError || !userProfileData) {
        throw new Error('Failed to get user profile');
      }

      // Submit the interview request
      const { error: submitError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('grace_interview_requests')
          .insert({
            user_id: userProfileData.id,
            phone_number: phoneNumber,
            company_name: companyName,
            job_title: jobTitle,
            job_description: jobDescription || null,
            status: 'pending'
          });
      });

      if (submitError) {
        throw submitError;
      }

      // Success
      toast({
        title: "Interview scheduled!",
        description: "Grace will call you within the next few minutes. Please keep your phone ready.",
        duration: 5000
      });

      // Reset form
      setPhoneNumber('');
      setCompanyName('');
      setJobTitle('');
      setJobDescription('');

      // Refresh credits to show updated count
      await refetchCredits();

    } catch (error: any) {
      console.error('Failed to schedule interview:', error);
      toast({
        title: "Failed to schedule",
        description: error.message || "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state during critical operations
  if (completionLoading || creditsLoading) {
    return (
      <Card className="w-full bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-gray-300">Loading your profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show session warning if needed
  if (showSessionWarning) {
    return (
      <Card className="w-full bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connection issue detected. 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1" 
                onClick={handleRefreshData}
              >
                Refresh
              </Button> 
              to continue.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-xl text-center">Schedule Your AI Mock Interview</CardTitle>
        
        {/* Enhanced Profile Status with Session Awareness */}
        <div className="space-y-2">
          {!isComplete && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200">
                Complete your profile first: 
                {!hasResume && " Add resume"}
                {!hasResume && !hasBio && " and"}
                {!hasBio && " Add bio"}
                . <Link to="/profile" className="underline hover:text-amber-100">Go to Profile</Link>
                {sessionManager && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-2 text-amber-200" 
                    onClick={handleRefreshData}
                  >
                    Refresh
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {isComplete && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                Profile complete! You're ready for AI mock interviews.
              </AlertDescription>
            </Alert>
          )}

          {credits && (
            <div className="text-center text-sm text-gray-400">
              AI Interview Credits: <span className="text-blue-400 font-medium">{credits.remaining_credits}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Phone Number *</Label>
            <PhoneInput
              country={'us'}
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value)}
              inputStyle={{
                width: '100%',
                height: '40px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: 'white',
                borderRadius: '0.375rem'
              }}
              buttonStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem 0 0 0.375rem'
              }}
              dropdownStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: 'white'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-gray-300">Company Name *</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="e.g., Google, Microsoft, Amazon"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-gray-300">Job Title *</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="e.g., Software Engineer, Product Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="text-gray-300">Job Description (Optional)</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              placeholder="Paste the job description here for more targeted interview questions..."
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !isComplete || !credits || credits.remaining_credits < 1}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule AI Mock Interview Call'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AIMockInterviewForm;
