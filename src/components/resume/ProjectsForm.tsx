
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface ProjectsFormProps {
  data: any;
  onChange: (data: any) => void;
}

const ProjectsForm = ({ data, onChange }: ProjectsFormProps) => {
  const projects = data.projects || [];

  const addProject = () => {
    const newProject = {
      project_name: '',
      description: '',
      technologies_used: '',
      your_role: '',
      results_outcomes: '',
      start_date: '',
      end_date: '',
      team_size: '',
      project_link: ''
    };
    onChange({
      projects: [...projects, newProject]
    });
  };

  const removeProject = (index: number) => {
    onChange({
      projects: projects.filter((_: any, i: number) => i !== index)
    });
  };

  const updateProject = (index: number, field: string, value: string) => {
    const updated = projects.map((project: any, i: number) => 
      i === index ? { ...project, [field]: value } : project
    );
    onChange({
      projects: updated
    });
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-gray-800">Projects</h3>
        <Button onClick={addProject} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {projects.map((project: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-6 space-y-4 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h4 className="text-lg font-medium text-gray-700">Project {index + 1}</h4>
            <Button
              onClick={() => removeProject(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor={`project_name_${index}`}>Project Name *</Label>
              <Input
                id={`project_name_${index}`}
                value={project.project_name || ''}
                onChange={(e) => updateProject(index, 'project_name', e.target.value)}
                placeholder="E-commerce Platform"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`your_role_${index}`}>Your Role</Label>
              <Input
                id={`your_role_${index}`}
                value={project.your_role || ''}
                onChange={(e) => updateProject(index, 'your_role', e.target.value)}
                placeholder="Frontend Developer, Team Lead..."
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`start_date_${index}`}>Start Date</Label>
              <Input
                id={`start_date_${index}`}
                type="month"
                value={project.start_date || ''}
                onChange={(e) => updateProject(index, 'start_date', e.target.value)}
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`end_date_${index}`}>End Date</Label>
              <Input
                id={`end_date_${index}`}
                type="month"
                value={project.end_date || ''}
                onChange={(e) => updateProject(index, 'end_date', e.target.value)}
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`team_size_${index}`}>Team Size</Label>
              <Input
                id={`team_size_${index}`}
                value={project.team_size || ''}
                onChange={(e) => updateProject(index, 'team_size', e.target.value)}
                placeholder="4 people"
                className="bg-zinc-800 w-full"
              />
            </div>

            <div className="min-w-0">
              <Label htmlFor={`project_link_${index}`}>Project Link (Optional)</Label>
              <Input
                id={`project_link_${index}`}
                value={project.project_link || ''}
                onChange={(e) => updateProject(index, 'project_link', e.target.value)}
                placeholder="https://github.com/username/project"
                className="bg-zinc-800 w-full"
              />
            </div>
          </div>

          <div className="min-w-0">
            <Label htmlFor={`description_${index}`}>Description & Objectives</Label>
            <Textarea
              id={`description_${index}`}
              value={project.description || ''}
              onChange={(e) => updateProject(index, 'description', e.target.value)}
              placeholder="Describe the project objectives and what you built..."
              rows={4}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`technologies_used_${index}`}>Technologies/Tools Used</Label>
            <Input
              id={`technologies_used_${index}`}
              value={project.technologies_used || ''}
              onChange={(e) => updateProject(index, 'technologies_used', e.target.value)}
              placeholder="React, Node.js, MongoDB, Docker..."
              className="bg-zinc-800 w-full"
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={`results_outcomes_${index}`}>Results/Outcomes</Label>
            <Textarea
              id={`results_outcomes_${index}`}
              value={project.results_outcomes || ''}
              onChange={(e) => updateProject(index, 'results_outcomes', e.target.value)}
              placeholder="Describe the impact, metrics, or achievements from this project..."
              rows={3}
              className="bg-zinc-800 w-full resize-none"
            />
          </div>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No projects added yet.</p>
          <p className="text-sm mt-2">Click "Add Project" to showcase your work.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsForm;
