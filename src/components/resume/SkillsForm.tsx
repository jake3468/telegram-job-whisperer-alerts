
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface SkillsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const SkillsForm = ({ data, onChange }: SkillsFormProps) => {
  const technicalSkills = data.technical_skills || [];
  const softSkills = data.soft_skills || [];
  const languages = data.languages || [];
  const certifications = data.certifications || [];

  const addSkill = (category: string) => {
    const currentSkills = data[category] || [];
    const newSkill = category === 'languages' 
      ? { language: '', proficiency: '' }
      : category === 'certifications'
      ? { name: '', issuer: '', date_obtained: '', expiry_date: '', credential_id: '' }
      : { name: '', level: '' };
    
    onChange({
      [category]: [...currentSkills, newSkill]
    });
  };

  const removeSkill = (category: string, index: number) => {
    const currentSkills = data[category] || [];
    onChange({
      [category]: currentSkills.filter((_: any, i: number) => i !== index)
    });
  };

  const updateSkill = (category: string, index: number, field: string, value: string) => {
    const currentSkills = data[category] || [];
    const updated = currentSkills.map((skill: any, i: number) => 
      i === index ? { ...skill, [field]: value } : skill
    );
    onChange({
      [category]: updated
    });
  };

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-gray-800">Skills</h3>

      {/* Technical Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-700">Technical Skills</h4>
          <Button 
            onClick={() => addSkill('technical_skills')} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        </div>

        {technicalSkills.map((skill: any, index: number) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`tech_skill_${index}`}>Skill</Label>
              <Input
                id={`tech_skill_${index}`}
                value={skill.name || ''}
                onChange={(e) => updateSkill('technical_skills', index, 'name', e.target.value)}
                placeholder="React, Python, AWS..."
                className="bg-zinc-800"
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`tech_level_${index}`}>Level</Label>
              <Select
                value={skill.level || ''}
                onValueChange={(value) => updateSkill('technical_skills', index, 'level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => removeSkill('technical_skills', index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Soft Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-700">Soft Skills</h4>
          <Button 
            onClick={() => addSkill('soft_skills')} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        </div>

        {softSkills.map((skill: any, index: number) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`soft_skill_${index}`}>Skill</Label>
              <Input
                id={`soft_skill_${index}`}
                value={skill.name || ''}
                onChange={(e) => updateSkill('soft_skills', index, 'name', e.target.value)}
                placeholder="Leadership, Communication, Problem-solving..."
                className="bg-zinc-800"
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`soft_level_${index}`}>Level</Label>
              <Select
                value={skill.level || ''}
                onValueChange={(value) => updateSkill('soft_skills', index, 'level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => removeSkill('soft_skills', index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-700">Languages</h4>
          <Button 
            onClick={() => addSkill('languages')} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Language
          </Button>
        </div>

        {languages.map((language: any, index: number) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`language_${index}`}>Language</Label>
              <Input
                id={`language_${index}`}
                value={language.language || ''}
                onChange={(e) => updateSkill('languages', index, 'language', e.target.value)}
                placeholder="English, Spanish, French..."
                className="bg-zinc-800"
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`proficiency_${index}`}>Proficiency</Label>
              <Select
                value={language.proficiency || ''}
                onValueChange={(value) => updateSkill('languages', index, 'proficiency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="fluent">Fluent</SelectItem>
                  <SelectItem value="native">Native</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => removeSkill('languages', index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-700">Certifications & Licenses</h4>
          <Button 
            onClick={() => addSkill('certifications')} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </Button>
        </div>

        {certifications.map((cert: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-md font-medium text-gray-700">Certification {index + 1}</h5>
              <Button
                onClick={() => removeSkill('certifications', index)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`cert_name_${index}`}>Certification Name</Label>
                <Input
                  id={`cert_name_${index}`}
                  value={cert.name || ''}
                  onChange={(e) => updateSkill('certifications', index, 'name', e.target.value)}
                  placeholder="AWS Certified Solutions Architect"
                  className="bg-zinc-800"
                />
              </div>

              <div>
                <Label htmlFor={`cert_issuer_${index}`}>Issuing Organization</Label>
                <Input
                  id={`cert_issuer_${index}`}
                  value={cert.issuer || ''}
                  onChange={(e) => updateSkill('certifications', index, 'issuer', e.target.value)}
                  placeholder="Amazon Web Services"
                  className="bg-zinc-800"
                />
              </div>

              <div>
                <Label htmlFor={`cert_date_${index}`}>Date Obtained</Label>
                <Input
                  id={`cert_date_${index}`}
                  type="month"
                  value={cert.date_obtained || ''}
                  onChange={(e) => updateSkill('certifications', index, 'date_obtained', e.target.value)}
                  className="bg-zinc-800"
                />
              </div>

              <div>
                <Label htmlFor={`cert_expiry_${index}`}>Expiry Date (Optional)</Label>
                <Input
                  id={`cert_expiry_${index}`}
                  type="month"
                  value={cert.expiry_date || ''}
                  onChange={(e) => updateSkill('certifications', index, 'expiry_date', e.target.value)}
                  className="bg-zinc-800"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`cert_id_${index}`}>Credential ID (Optional)</Label>
                <Input
                  id={`cert_id_${index}`}
                  value={cert.credential_id || ''}
                  onChange={(e) => updateSkill('certifications', index, 'credential_id', e.target.value)}
                  placeholder="ABC123DEF456"
                  className="bg-zinc-800"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsForm;
