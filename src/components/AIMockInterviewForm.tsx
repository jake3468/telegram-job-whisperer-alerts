import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useDeferredCreditDeduction } from '@/hooks/useDeferredCreditDeduction';
import { useAIInterviewCredits } from '@/hooks/useAIInterviewCredits';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';

interface AIMockInterviewFormProps {
  prefillData?: {
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
  };
  sessionManager?: any;
}

const AIMockInterviewForm = ({ prefillData, sessionManager }: AIMockInterviewFormProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState(prefillData?.companyName || '');
  const [jobTitle, setJobTitle] = useState(prefillData?.jobTitle || '');
  const [jobDescription, setJobDescription] = useState(prefillData?.jobDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();
  const { userProfile } = useCachedUserProfile();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.5);
  const { deductCredits, isDeducting } = useDeferredCreditDeduction();
  const { useCredit } = useAIInterviewCredits();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to schedule an AI Mock Interview.",
        variant: "destructive",
      });
      return;
    }

    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    if (!phoneNumber || !companyName || !jobTitle || !jobDescription) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to schedule an AI Mock Interview.",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile?.user_id) {
      toast({
        title: "Profile not loaded",
        description: "Please refresh the page to load your user profile.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isValidNumber = await validatePhoneNumber(phoneNumber);
      if (!isValidNumber) {
        toast({
          title: "Phone number already in use",
          description: "This phone number is already associated with an interview request.",
          variant: "destructive",
        });
        return;
      }

      // Optimistically deduct credits
      const creditDeductionSuccess = await useCredit('AI mock interview requested');
      if (!creditDeductionSuccess) {
        toast({
          title: "Credit deduction failed",
          description: "Unable to deduct credits. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Submit the form data
      const { data, error } = await supabase
        .from('grace_interview_requests')
        .insert([
          {
            user_id: userProfile.user_id,
            phone_number: phoneNumber,
            company_name: companyName,
            job_title: jobTitle,
            job_description: jobDescription,
            status: 'pending',
          },
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Error",
          description: "Failed to schedule AI Mock Interview. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "AI Mock Interview scheduled successfully! Grace will call you shortly.",
      });

      navigate('/ai-mock-interview-reports');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule AI Mock Interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePhoneNumber = async (phoneNumber: string) => {
    try {
      console.log('[AIMockInterviewForm] Validating phone number:', phoneNumber);
      
      // CRITICAL FIX: Use makeAuthenticatedRequest for proper JWT token handling
      const { data: existingRequest, error } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('grace_interview_requests')
          .select('user_id, phone_number')
          .eq('phone_number', phoneNumber)
          .maybeSingle();
      }, { operationType: 'validate_phone_number' });

      console.log('[AIMockInterviewForm] Phone number validation query result:', existingRequest);

      if (existingRequest) {
        console.log('[AIMockInterviewForm] Phone number already exists for user_id:', existingRequest.user_id);
        return false;
      }

      console.log('[AIMockInterviewForm] Phone number is available');
      return true;
    } catch (error) {
      console.error('[AIMockInterviewForm] Phone number validation error:', error);
      throw new Error('Unable to validate phone number. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          type="tel"
          id="phoneNumber"
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={isSubmitting || isDeducting}
        />
      </div>
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          type="text"
          id="companyName"
          placeholder="Enter the company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={isSubmitting || isDeducting}
        />
      </div>
      <div>
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          type="text"
          id="jobTitle"
          placeholder="Enter the job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          disabled={isSubmitting || isDeducting}
        />
      </div>
      <div>
        <Label htmlFor="jobDescription">Job Description</Label>
        <Input
          type="text"
          id="jobDescription"
          placeholder="Enter the job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={isSubmitting || isDeducting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting || isDeducting} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-purple-500">
        {isSubmitting || isDeducting ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 4V2m0 16v2m-5.196-3.004L5.636 19.364M17.196 5.004L18.364 6.172M4 12H2m16 0h2M5.004 6.804L6.172 5.636M18.804 17.196L17.636 18.364"/>
            </svg>
            Scheduling...
          </>
        ) : (
          <>
            <Phone className="w-4 h-4 mr-2" />
            Schedule AI Mock Interview
          </>
        )}
      </Button>
    </form>
  );
};

export default AIMockInterviewForm;
