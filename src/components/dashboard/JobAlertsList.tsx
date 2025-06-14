import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, MapPin, Clock, Bell } from 'lucide-react';
interface JobAlert {
  id: string;
  country: string;
  location: string;
  job_title: string;
  job_type: 'Remote' | 'On-site' | 'Hybrid';
  alert_frequency: string;
  preferred_time: string;
  max_alerts_per_day: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}
interface JobAlertsListProps {
  alerts: JobAlert[];
  onEdit: (alert: JobAlert) => void;
  onDelete: (alertId: string) => void;
}
const JobAlertsList = ({
  alerts,
  onEdit,
  onDelete
}: JobAlertsListProps) => {
  if (alerts.length === 0) {
    return <div className="text-center py-6">
        <Bell className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 font-inter text-base mb-1">No job alerts yet</p>
        <p className="text-gray-500 font-inter text-sm">Create your first alert to get started</p>
      </div>;
  }
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'Remote':
        return 'bg-pastel-mint text-black';
      case 'On-site':
        return 'bg-pastel-blue text-black';
      case 'Hybrid':
        return 'bg-pastel-peach text-black';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  return <div className="space-y-3">
      {alerts.map(alert => <Card key={alert.id} className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 bg-amber-700">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="text-base font-medium text-white font-inter truncate">
                    {alert.job_title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(alert.job_type)} flex-shrink-0 w-fit`}>
                    {alert.job_type}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="font-inter truncate">{alert.location}, {alert.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="font-inter truncate">{alert.preferred_time} ({alert.timezone})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bell className="w-3 h-3 flex-shrink-0" />
                    <span className="font-inter">{alert.alert_frequency}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-inter">Max {alert.max_alerts_per_day} alerts/day</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end lg:justify-start flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => onEdit(alert)} className="font-inter h-8 px-3 text-xs">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(alert.id)} className="font-inter h-8 px-3 text-xs">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>)}
    </div>;
};
export default JobAlertsList;