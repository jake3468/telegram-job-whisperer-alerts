
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormattingPreferencesFormProps {
  data: any;
  onChange: (data: any) => void;
}

const FormattingPreferencesForm = ({ data, onChange }: FormattingPreferencesFormProps) => {
  const handleChange = (field: string, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Formatting Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="template_style">Template Style</Label>
          <Select
            value={data.template_style || 'professional'}
            onValueChange={(value) => handleChange('template_style', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select template style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="color_scheme">Color Scheme</Label>
          <Select
            value={data.color_scheme || 'blue'}
            onValueChange={(value) => handleChange('color_scheme', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="font_preference">Font Preference</Label>
          <Select
            value={data.font_preference || 'Arial'}
            onValueChange={(value) => handleChange('font_preference', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Calibri">Calibri</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="length_preference">Length Preference</Label>
          <Select
            value={data.length_preference || '2-page'}
            onValueChange={(value) => handleChange('length_preference', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-page">1 Page</SelectItem>
              <SelectItem value="2-page">2 Pages</SelectItem>
              <SelectItem value="3-page">3+ Pages</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="output_format">Output Format</Label>
          <Select
            value={data.output_format || 'PDF'}
            onValueChange={(value) => handleChange('output_format', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Word">Word Document</SelectItem>
              <SelectItem value="HTML">HTML</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FormattingPreferencesForm;
