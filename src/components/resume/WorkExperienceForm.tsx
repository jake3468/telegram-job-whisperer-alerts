
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface WorkExperienceFormProps {
  data: any;
  onChange: (data: any) => void;
}

const WorkExperienceForm = ({ data, onChange }: WorkExperienceFormProps) => {
  const workExperience = data.work_experience || [];

  const addExperience = () => {
    const newExperience = {
      job_title: '',
      company_name: '',
      company_location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      employment_type: '',
      job_description: '',
      key_achievements: '',
      technologies_used: '',
      team_size: '',
      budget_managed: ''
    };
    onChange({
      work_experience: [...workExperience, newExperience]
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      work_experience: workExperience.filter((_: any, i: number) => i !== index)
    });
  };

  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const updated = workExperience.map((exp: any, i: number) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    onChange({
      work_experience: updated
    });
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-gray-800">Work Experience</h3>
        <Button onClick={addExperience} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </div>

      {workExperience.map((experience: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-6 space-y-4 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-gray-700">Experience {index + 1}</h4>
            <Button
              onClick={() => removeExperience(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor={`job_title_${index}`}>Job Title *</Label>
              <Input
                id={`job_title_${index}`}
                value={experience.job_title || ''}
                onChange={(e) => updateExperience(index, 'job_title', e.target.value)}
                placeholder="Software Engineer"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`company_name_${index}`}>Company Name *</Label>
              <Input
                id={`company_name_${index}`}
                value={experience.company_name || ''}
                onChange={(e) => updateExperience(index, 'company_name', e.target.value)}
                placeholder="Tech Corp"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`company_location_${index}`}>Company Location</Label>
              <Input
                id={`company_location_${index}`}
                value={experience.company_location || ''}
                onChange={(e) => updateExperience(index, 'company_location', e.target.value)}
                placeholder="San Francisco, CA"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`employment_type_${index}`}>Employment Type</Label>
              <Select
                value={experience.employment_type || ''}
                onValueChange={(value) => updateExperience(index, 'employment_type', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <Label htmlFor={`start_date_${index}`}>Start Date *</Label>
              <Input
                id={`start_date_${index}`}
                type="month"
                value={experience.start_date || ''}
                onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`end_date_${index}`}>End Date</Label>
              <Input
                id={`end_date_${index}`}
                type="month"
                value={experience.end_date || ''}
                onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                disabled={experience.is_current}
                className="bg-zinc-800 w-full"
              />
              <label className="flex items-center mt-2 text-sm">
                <input
                  type="checkbox"
                  checked={experience.is_current || false}
                  onChange={(e) => updateExperience(index, 'is_current', e.target.checked)}
                  className="mr-2"
                />
                Currently working here
              </label>
            </div>

            <div className="min-w-0">
              <Label htmlFor={`team_size_${index}`}>Team Size Managed</Label>
              <Input
                id={`team_size_${index}`}
                value={experience.team_size || ''}
                onChange={(e) => updateExperience(index, 'team_size', e.target.value)}
                placeholder="5 people"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`budget_managed_${index}`}>Budget Managed</Label>
              <Input
                id={`budget_managed_${index}`}
                value={experience.budget_managed || ''}
                onChange={(e) => updateExperience(index, 'budget_managed', e.target.value)}
                placeholder="$100,000"
                className="bg-zinc-800 w-full"
              />
            </div>
          </div>

          <div className="min-w-0">
            <Label htmlFor={`job_description_${index}`}>Job Description/Responsibilities</Label>
            <Textarea
              id={`job_description_${index}`}
              value={experience.job_description || ''}
              onChange={(e) => updateExperience(index, 'job_description', e.target.value)}
              placeholder="Describe your main responsibilities and duties..."
              rows={4}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`key_achievements_${index}`}>Key Achievements</Label>
            <Textarea
              id={`key_achievements_${index}`}
              value={experience.key_achievements || ''}
              onChange={(e) => updateExperience(index, 'key_achievements', e.target.value)}
              placeholder="List your key achievements with quantifiable results..."
              rows={3}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`technologies_used_${index}`}>Technologies/Tools Used</Label>
            <Input
              id={`technologies_used_${index}`}
              value={experience.technologies_used || ''}
              onChange={(e) => updateExperience(index, 'technologies_used', e.target.value)}
              placeholder="React, Node.js, PostgreSQL, AWS..."
              className="bg-zinc-800 w-full"
            />
          </div>
        </div>
      ))}

      {workExperience.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No work experience added yet.</p>
          <p className="text-sm mt-2">Click "Add Experience" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default WorkExperienceForm;
