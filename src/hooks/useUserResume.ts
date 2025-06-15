
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useToast } from '@/hooks/use-toast';

export interface ResumeData {
  id?: string;
  user_profile_id?: string;
  // Personal Information
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  social_profiles?: any[];
  
  // Professional Summary
  career_level?: string;
  years_experience?: number;
  skills_summary?: string;
  career_objective?: string;
  industry_focus?: string;
  
  // Work Experience
  work_experience?: any[];
  
  // Education
  education?: any[];
  
  // Skills
  technical_skills?: any[];
  soft_skills?: any[];
  languages?: any[];
  certifications?: any[];
  
  // Projects
  projects?: any[];
  
  // Additional Sections
  publications?: any[];
  speaking_engagements?: any[];
  volunteer_work?: any[];
  memberships?: any[];
  awards?: any[];
  patents?: any[];
  hobbies?: string;
  
  // Formatting Preferences
  template_style?: string;
  color_scheme?: string;
  font_preference?: string;
  section_order?: any[];
  length_preference?: string;
  output_format?: string;
  
  created_at?: string;
  updated_at?: string;
}

export const useUserResume = () => {
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resumeData, isLoading, error } = useQuery({
    queryKey: ['user_resume', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;

      const { data, error } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching resume:', error);
        throw error;
      }

      return data;
    },
    enabled: !!userProfile?.id,
  });

  const saveResumeMutation = useMutation({
    mutationFn: async (resumeData: ResumeData) => {
      if (!userProfile?.id) throw new Error('User profile not found');

      const dataToSave = {
        ...resumeData,
        user_profile_id: userProfile.id,
      };

      if (resumeData.id) {
        // Update existing resume
        const { data, error } = await supabase
          .from('user_resumes')
          .update(dataToSave)
          .eq('id', resumeData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new resume
        const { data, error } = await supabase
          .from('user_resumes')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_resume'] });
      toast({
        title: "Success",
        description: "Resume saved successfully!",
      });
    },
    onError: (error) => {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    resumeData,
    isLoading,
    error,
    saveResume: saveResumeMutation.mutate,
    isSaving: saveResumeMutation.isPending,
  };
};
