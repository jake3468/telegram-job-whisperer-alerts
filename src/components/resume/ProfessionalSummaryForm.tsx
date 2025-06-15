import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface ProfessionalSummaryFormProps {
  data: any;
  onChange: (data: any) => void;
}
const ProfessionalSummaryForm = ({
  data,
  onChange
}: ProfessionalSummaryFormProps) => {
  const handleInputChange = (field: string, value: string | number) => {
    onChange({
      [field]: value
    });
  };
  return <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Professional Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="career_level">Career Level</Label>
          <Select value={data.career_level || ''} onValueChange={value => handleInputChange('career_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select career level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry-level">Entry Level</SelectItem>
              <SelectItem value="mid-level">Mid Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="years_experience">Years of Experience</Label>
          <Input id="years_experience" type="number" value={data.years_experience || ''} onChange={e => handleInputChange('years_experience', parseInt(e.target.value) || 0)} placeholder="5" min="0" className="bg-zinc-800" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="industry_focus">Industry Focus</Label>
        <Input id="industry_focus" value={data.industry_focus || ''} onChange={e => handleInputChange('industry_focus', e.target.value)} placeholder="e.g., Technology, Healthcare, Finance" className="bg-zinc-800" />
      </div>
      
      <div>
        <Label htmlFor="skills_summary">Key Skills Summary</Label>
        <Textarea id="skills_summary" value={data.skills_summary || ''} onChange={e => handleInputChange('skills_summary', e.target.value)} placeholder="Brief summary of your key skills and expertise..." rows={3} className="bg-zinc-800" />
      </div>
      
      <div>
        <Label htmlFor="career_objective">Career Goals/Objective</Label>
        <Textarea id="career_objective" value={data.career_objective || ''} onChange={e => handleInputChange('career_objective', e.target.value)} placeholder="Describe your career goals and what you're looking to achieve..." rows={4} className="bg-zinc-800" />
      </div>
    </div>;
};
export default ProfessionalSummaryForm;