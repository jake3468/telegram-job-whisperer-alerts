import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ExternalLink, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobEntry } from '@/types/jobTracker';

interface SortableJobCardProps {
  job: JobEntry;
  onView: (job: JobEntry) => void;
  onEdit: (job: JobEntry) => void;
  onDelete: (jobId: string) => void;
  onStatusChange: (jobId: string, status: JobEntry['status']) => void;
  updateActivity?: () => void;
}

export function SortableJobCard({
  job,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  updateActivity
}: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saved': return 'bg-blue-100 text-blue-800';
      case 'applied': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-green-100 text-green-800';
      case 'offer': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="bg-white/90 hover:bg-white hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing" {...listeners}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm leading-tight truncate">
                  {job.company_name}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {job.job_title}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActivity?.();
                    }}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(job);
                      updateActivity?.();
                    }}
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(job);
                      updateActivity?.();
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(job.id);
                      updateActivity?.();
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Badge className={`text-xs ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
            
            {job.job_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.job_url, '_blank');
                  updateActivity?.();
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Job
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}