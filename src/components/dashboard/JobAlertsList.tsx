
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

const JobAlertsList = ({ alerts, onEdit, onDelete }: JobAlertsListProps) => {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 font-inter text-lg mb-2">No job alerts yet</p>
        <p className="text-gray-500 font-inter">Create your first alert to get started</p>
      </div>
    );
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

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-white font-inter">
                    {alert.job_title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(alert.job_type)}`}>
                    {alert.job_type}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-inter">{alert.location}, {alert.country}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-inter">{alert.preferred_time} ({alert.timezone})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-inter">{alert.alert_frequency}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-inter">Max {alert.max_alerts_per_day} alerts/day</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(alert)}
                  className="font-inter"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(alert.id)}
                  className="font-inter"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobAlertsList;
