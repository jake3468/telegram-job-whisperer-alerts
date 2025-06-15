
import { Label } from '@/components/ui/label';

interface ProjectsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const ProjectsForm = ({ data, onChange }: ProjectsFormProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Projects</h3>
      <div className="text-center py-8">
        <Label className="text-gray-600">Projects form - Coming soon!</Label>
        <p className="text-sm text-gray-500 mt-2">This section will allow you to showcase your projects.</p>
      </div>
    </div>
  );
};

export default ProjectsForm;
