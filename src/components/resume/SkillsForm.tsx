
import { Label } from '@/components/ui/label';

interface SkillsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const SkillsForm = ({ data, onChange }: SkillsFormProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
      <div className="text-center py-8">
        <Label className="text-gray-600">Skills form - Coming soon!</Label>
        <p className="text-sm text-gray-500 mt-2">This section will allow you to add your technical and soft skills.</p>
      </div>
    </div>
  );
};

export default SkillsForm;
