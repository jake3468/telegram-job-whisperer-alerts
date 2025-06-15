
import { Label } from '@/components/ui/label';

interface AdditionalSectionsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const AdditionalSectionsForm = ({ data, onChange }: AdditionalSectionsFormProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Sections</h3>
      <div className="text-center py-8">
        <Label className="text-gray-600">Additional sections form - Coming soon!</Label>
        <p className="text-sm text-gray-500 mt-2">This section will include certifications, publications, awards, etc.</p>
      </div>
    </div>
  );
};

export default AdditionalSectionsForm;
