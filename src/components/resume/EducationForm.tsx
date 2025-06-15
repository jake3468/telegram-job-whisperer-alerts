
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface EducationFormProps {
  data: any;
  onChange: (data: any) => void;
}

const EducationForm = ({ data, onChange }: EducationFormProps) => {
  const education = data.education || [];

  const addEducation = () => {
    const newEducation = {
      institution_name: '',
      degree_type: '',
      field_of_study: '',
      graduation_date: '',
      gpa: '',
      relevant_coursework: '',
      academic_honors: '',
      thesis_project: ''
    };
    onChange({
      education: [...education, newEducation]
    });
  };

  const removeEducation = (index: number) => {
    onChange({
      education: education.filter((_: any, i: number) => i !== index)
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = education.map((edu: any, i: number) => 
      i === index ? { ...edu, [field]: value } : edu
    );
    onChange({
      education: updated
    });
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-gray-800">Education</h3>
        <Button onClick={addEducation} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Education
        </Button>
      </div>

      {education.map((edu: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-6 space-y-4 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-gray-700">Education {index + 1}</h4>
            <Button
              onClick={() => removeEducation(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor={`institution_${index}`}>Institution Name *</Label>
              <Input
                id={`institution_${index}`}
                value={edu.institution_name || ''}
                onChange={(e) => updateEducation(index, 'institution_name', e.target.value)}
                placeholder="University of California"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`degree_type_${index}`}>Degree Type</Label>
              <Select
                value={edu.degree_type || ''}
                onValueChange={(value) => updateEducation(index, 'degree_type', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School Diploma</SelectItem>
                  <SelectItem value="associate">Associate Degree</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate/PhD</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <Label htmlFor={`field_of_study_${index}`}>Field of Study *</Label>
              <Input
                id={`field_of_study_${index}`}
                value={edu.field_of_study || ''}
                onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                placeholder="Computer Science"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`graduation_date_${index}`}>Graduation Date</Label>
              <Input
                id={`graduation_date_${index}`}
                type="month"
                value={edu.graduation_date || ''}
                onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)}
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`gpa_${index}`}>GPA (Optional)</Label>
              <Input
                id={`gpa_${index}`}
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                placeholder="3.8/4.0"
                className="bg-zinc-800 w-full"
              />
            </div>
          </div>

          <div className="min-w-0">
            <Label htmlFor={`relevant_coursework_${index}`}>Relevant Coursework</Label>
            <Textarea
              id={`relevant_coursework_${index}`}
              value={edu.relevant_coursework || ''}
              onChange={(e) => updateEducation(index, 'relevant_coursework', e.target.value)}
              placeholder="Data Structures, Algorithms, Database Systems, Software Engineering..."
              rows={3}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`academic_honors_${index}`}>Academic Honors/Awards</Label>
            <Input
              id={`academic_honors_${index}`}
              value={edu.academic_honors || ''}
              onChange={(e) => updateEducation(index, 'academic_honors', e.target.value)}
              placeholder="Dean's List, Magna Cum Laude, Phi Beta Kappa..."
              className="bg-zinc-800 w-full"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`thesis_project_${index}`}>Thesis/Capstone Project</Label>
            <Textarea
              id={`thesis_project_${index}`}
              value={edu.thesis_project || ''}
              onChange={(e) => updateEducation(index, 'thesis_project', e.target.value)}
              placeholder="Brief description of your thesis or capstone project..."
              rows={3}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>
        </div>
      ))}

      {education.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No education entries added yet.</p>
          <p className="text-sm mt-2">Click "Add Education" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default EducationForm;
