
import { Label } from '@/components/ui/label';

interface WorkExperienceFormProps {
  data: any;
  onChange: (data: any) => void;
}

const WorkExperienceForm = ({ data, onChange }: WorkExperienceFormProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Work Experience</h3>
      <div className="text-center py-8">
        <Label className="text-gray-600">Work Experience form - Coming soon!</Label>
        <p className="text-sm text-gray-500 mt-2">This section will allow you to add your work history.</p>
      </div>
    </div>
  );
};

export default WorkExperienceForm;
