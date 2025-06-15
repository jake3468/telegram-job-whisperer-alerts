
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface AdditionalSectionsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const AdditionalSectionsForm = ({ data, onChange }: AdditionalSectionsFormProps) => {
  const publications = data.publications || [];
  const speakingEngagements = data.speaking_engagements || [];
  const volunteerWork = data.volunteer_work || [];
  const memberships = data.memberships || [];
  const awards = data.awards || [];
  const patents = data.patents || [];

  const addItem = (category: string) => {
    const currentItems = data[category] || [];
    let newItem = {};

    switch (category) {
      case 'publications':
        newItem = { title: '', publication: '', date: '', url: '', description: '' };
        break;
      case 'speaking_engagements':
        newItem = { title: '', event: '', date: '', location: '', description: '' };
        break;
      case 'volunteer_work':
        newItem = { role: '', organization: '', start_date: '', end_date: '', description: '' };
        break;
      case 'memberships':
        newItem = { organization: '', role: '', start_date: '', end_date: '', description: '' };
        break;
      case 'awards':
        newItem = { title: '', issuer: '', date: '', description: '' };
        break;
      case 'patents':
        newItem = { title: '', patent_number: '', date: '', description: '' };
        break;
    }

    onChange({
      [category]: [...currentItems, newItem]
    });
  };

  const removeItem = (category: string, index: number) => {
    const currentItems = data[category] || [];
    onChange({
      [category]: currentItems.filter((_: any, i: number) => i !== index)
    });
  };

  const updateItem = (category: string, index: number, field: string, value: string) => {
    const currentItems = data[category] || [];
    const updated = currentItems.map((item: any, i: number) => 
      i === index ? { ...item, [field]: value } : item
    );
    onChange({
      [category]: updated
    });
  };

  const handleHobbiesChange = (value: string) => {
    onChange({
      hobbies: value
    });
  };

  const SectionTemplate = ({ 
    title, 
    category, 
    items, 
    fields 
  }: { 
    title: string; 
    category: string; 
    items: any[]; 
    fields: { name: string; label: string; type?: string; placeholder?: string; rows?: number }[] 
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-700">{title}</h4>
        <Button 
          onClick={() => addItem(category)} 
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add {title.slice(0, -1)}
        </Button>
      </div>

      {items.map((item: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-md font-medium text-gray-700">{title.slice(0, -1)} {index + 1}</h5>
            <Button
              onClick={() => removeItem(category, index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={field.rows ? "md:col-span-2" : ""}>
                <Label htmlFor={`${category}_${field.name}_${index}`}>{field.label}</Label>
                {field.rows ? (
                  <Textarea
                    id={`${category}_${field.name}_${index}`}
                    value={item[field.name] || ''}
                    onChange={(e) => updateItem(category, index, field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows}
                    className="bg-zinc-800"
                  />
                ) : (
                  <Input
                    id={`${category}_${field.name}_${index}`}
                    type={field.type || 'text'}
                    value={item[field.name] || ''}
                    onChange={(e) => updateItem(category, index, field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-zinc-800"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-gray-800">Additional Sections</h3>

      {/* Publications */}
      <SectionTemplate
        title="Publications"
        category="publications"
        items={publications}
        fields={[
          { name: 'title', label: 'Publication Title', placeholder: 'Research Paper Title' },
          { name: 'publication', label: 'Publication/Journal', placeholder: 'IEEE Transactions' },
          { name: 'date', label: 'Publication Date', type: 'month' },
          { name: 'url', label: 'URL (Optional)', placeholder: 'https://...' },
          { name: 'description', label: 'Description', placeholder: 'Brief description of the publication...', rows: 3 }
        ]}
      />

      {/* Speaking Engagements */}
      <SectionTemplate
        title="Speaking Engagements"
        category="speaking_engagements"
        items={speakingEngagements}
        fields={[
          { name: 'title', label: 'Presentation Title', placeholder: 'Conference Talk Title' },
          { name: 'event', label: 'Event/Conference', placeholder: 'Tech Conference 2024' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
          { name: 'description', label: 'Description', placeholder: 'Brief description of your presentation...', rows: 3 }
        ]}
      />

      {/* Volunteer Work */}
      <SectionTemplate
        title="Volunteer Work"
        category="volunteer_work"
        items={volunteerWork}
        fields={[
          { name: 'role', label: 'Role/Position', placeholder: 'Volunteer Coordinator' },
          { name: 'organization', label: 'Organization', placeholder: 'Red Cross' },
          { name: 'start_date', label: 'Start Date', type: 'month' },
          { name: 'end_date', label: 'End Date', type: 'month' },
          { name: 'description', label: 'Description', placeholder: 'Describe your volunteer activities...', rows: 3 }
        ]}
      />

      {/* Professional Memberships */}
      <SectionTemplate
        title="Professional Memberships"
        category="memberships"
        items={memberships}
        fields={[
          { name: 'organization', label: 'Organization', placeholder: 'IEEE Computer Society' },
          { name: 'role', label: 'Role/Position', placeholder: 'Member, Board Director...' },
          { name: 'start_date', label: 'Start Date', type: 'month' },
          { name: 'end_date', label: 'End Date (Optional)', type: 'month' },
          { name: 'description', label: 'Description', placeholder: 'Describe your involvement...', rows: 3 }
        ]}
      />

      {/* Awards & Recognitions */}
      <SectionTemplate
        title="Awards & Recognitions"
        category="awards"
        items={awards}
        fields={[
          { name: 'title', label: 'Award Title', placeholder: 'Employee of the Year' },
          { name: 'issuer', label: 'Issuing Organization', placeholder: 'ABC Company' },
          { name: 'date', label: 'Date Received', type: 'month' },
          { name: 'description', label: 'Description', placeholder: 'Brief description of the award...', rows: 3 }
        ]}
      />

      {/* Patents */}
      <SectionTemplate
        title="Patents"
        category="patents"
        items={patents}
        fields={[
          { name: 'title', label: 'Patent Title', placeholder: 'Innovative Algorithm for...' },
          { name: 'patent_number', label: 'Patent Number', placeholder: 'US1234567' },
          { name: 'date', label: 'Date Filed/Granted', type: 'month' },
          { name: 'description', label: 'Description', placeholder: 'Brief description of the patent...', rows: 3 }
        ]}
      />

      {/* Hobbies/Interests */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-700">Hobbies & Interests (Optional)</h4>
        <div>
          <Label htmlFor="hobbies">Personal Interests</Label>
          <Textarea
            id="hobbies"
            value={data.hobbies || ''}
            onChange={(e) => handleHobbiesChange(e.target.value)}
            placeholder="Photography, hiking, reading, playing guitar, cooking..."
            rows={3}
            className="bg-zinc-800"
          />
          <p className="text-sm text-gray-500 mt-1">
            Include hobbies that show personality or relevant skills. Keep it professional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditionalSectionsForm;
