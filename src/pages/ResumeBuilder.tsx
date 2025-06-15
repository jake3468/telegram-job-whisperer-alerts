import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useUserResume } from '@/hooks/useUserResume';
import PersonalInfoForm from '@/components/resume/PersonalInfoForm';
import ProfessionalSummaryForm from '@/components/resume/ProfessionalSummaryForm';
import WorkExperienceForm from '@/components/resume/WorkExperienceForm';
import EducationForm from '@/components/resume/EducationForm';
import SkillsForm from '@/components/resume/SkillsForm';
import ProjectsForm from '@/components/resume/ProjectsForm';
import AdditionalSectionsForm from '@/components/resume/AdditionalSectionsForm';
import FormattingPreferencesForm from '@/components/resume/FormattingPreferencesForm';

const steps = [
  {
    id: 1,
    title: 'Personal Information',
    component: PersonalInfoForm
  },
  {
    id: 2,
    title: 'Professional Summary',
    component: ProfessionalSummaryForm
  },
  {
    id: 3,
    title: 'Work Experience',
    component: WorkExperienceForm
  },
  {
    id: 4,
    title: 'Education',
    component: EducationForm
  },
  {
    id: 5,
    title: 'Skills',
    component: SkillsForm
  },
  {
    id: 6,
    title: 'Projects',
    component: ProjectsForm
  },
  {
    id: 7,
    title: 'Additional Sections',
    component: AdditionalSectionsForm
  },
  {
    id: 8,
    title: 'Formatting Preferences',
    component: FormattingPreferencesForm
  }
];

function normalizeResumeData(formData: any) {
  // user_resumes expects these fields as arrays (jsonb):
  const jsonbArrayFields = [
    "work_experience",
    "education",
    "technical_skills",
    "soft_skills",
    "languages",
    "certifications",
    "projects",
    "publications",
    "speaking_engagements",
    "volunteer_work",
    "memberships",
    "awards",
    "patents",
    "section_order"
  ];

  // Fields that should be a number or null
  const numberFields = ["years_experience"];

  // The keys of the resume table:
  const allowedKeys = [
    "id", "user_profile_id", "full_name", "email", "phone", "location",
    "linkedin_url", "portfolio_url", "github_url", "social_profiles",
    "career_level", "years_experience", "skills_summary", "career_objective", "industry_focus",
    "work_experience", "education",
    "technical_skills", "soft_skills", "languages", "certifications",
    "projects",
    "publications", "speaking_engagements", "volunteer_work", "memberships", "awards", "patents", "hobbies",
    "template_style", "color_scheme", "font_preference", "section_order", "length_preference", "output_format",
    "created_at", "updated_at"
  ];

  // Only keep allowed keys, convert undefined to null, handle numbers & arrays
  const normalized: any = {};
  for (const key of allowedKeys) {
    let value = formData[key];
    // Convert undefined to null
    if (value === undefined) {
      value = null;
    }
    // For array fields, always assign array (never null/undefined)
    if (jsonbArrayFields.includes(key)) {
      value = Array.isArray(value) ? value : [];
    }

    // Convert number fields (empty string or NaN)
    if (numberFields.includes(key)) {
      if (typeof value === "string" && value.trim() === "") {
        value = null;
      } else if (typeof value === "number" && isNaN(value)) {
        value = null;
      } else if (typeof value !== "number" && typeof value !== "undefined" && value !== null) {
        let numeric = Number(value);
        value = isNaN(numeric) ? null : numeric;
      }
    }

    normalized[key] = value;
  }
  return normalized;
}

const ResumeBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { resumeData, saveResume, isSaving } = useUserResume();
  const [formData, setFormData] = useState(resumeData || {});

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentComponent = currentStepData?.component;
  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    const normalized = normalizeResumeData(formData);
    saveResume(normalized);
  };

  const handleDataChange = (stepData: any) => {
    setFormData(prev => ({
      ...prev,
      ...stepData
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="text-center bg-indigo-400 px-4 py-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800">
                Resume Builder
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-teal-950">
                Step {currentStep} of {steps.length}: {currentStepData?.title}
              </CardDescription>
              <div className="mt-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm mt-2 text-zinc-800">{Math.round(progress)}% Complete</p>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6">
              <div className="overflow-hidden">
                {CurrentComponent && (
                  <CurrentComponent 
                    data={formData} 
                    onChange={handleDataChange} 
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t gap-4">
                <Button 
                  onClick={handlePrevious} 
                  disabled={currentStep === 1} 
                  variant="outline" 
                  className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    variant="outline" 
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Progress'}
                  </Button>

                  <Button 
                    onClick={handleNext} 
                    disabled={currentStep === steps.length} 
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResumeBuilder;
