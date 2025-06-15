
-- Create table for storing user resume data
CREATE TABLE public.user_resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_profile_id uuid NOT NULL REFERENCES public.user_profile(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  portfolio_url text,
  github_url text,
  social_profiles jsonb DEFAULT '[]'::jsonb,
  
  -- Professional Summary
  career_level text,
  years_experience integer,
  skills_summary text,
  career_objective text,
  industry_focus text,
  
  -- Work Experience (array of objects)
  work_experience jsonb DEFAULT '[]'::jsonb,
  
  -- Education (array of objects)
  education jsonb DEFAULT '[]'::jsonb,
  
  -- Skills
  technical_skills jsonb DEFAULT '[]'::jsonb,
  soft_skills jsonb DEFAULT '[]'::jsonb,
  languages jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  
  -- Projects (array of objects)
  projects jsonb DEFAULT '[]'::jsonb,
  
  -- Additional Sections
  publications jsonb DEFAULT '[]'::jsonb,
  speaking_engagements jsonb DEFAULT '[]'::jsonb,
  volunteer_work jsonb DEFAULT '[]'::jsonb,
  memberships jsonb DEFAULT '[]'::jsonb,
  awards jsonb DEFAULT '[]'::jsonb,
  patents jsonb DEFAULT '[]'::jsonb,
  hobbies text,
  
  -- Formatting Preferences
  template_style text DEFAULT 'professional',
  color_scheme text DEFAULT 'blue',
  font_preference text DEFAULT 'Arial',
  section_order jsonb DEFAULT '[]'::jsonb,
  length_preference text DEFAULT '2-page',
  output_format text DEFAULT 'PDF',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own resumes
CREATE POLICY "Users can manage their own resumes" 
  ON public.user_resumes 
  FOR ALL 
  USING (
    user_profile_id IN (
      SELECT id FROM public.user_profile 
      WHERE user_id = public.get_current_user_uuid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON public.user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_user_resumes_user_profile_id ON public.user_resumes(user_profile_id);
