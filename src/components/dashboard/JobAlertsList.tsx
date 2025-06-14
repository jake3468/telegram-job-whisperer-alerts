
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
        return 'bg-orange-300 text-orange-900';
      case 'On-site':
        return 'bg-yellow-300 text-yellow-900';
      case 'Hybrid':
        return 'bg-pink-200 text-pink-900';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  return (
    <div className="space-y-3">
      {alerts.map(alert =>
        <Card
          key={alert.id}
          className="bg-gradient-to-br from-orange-200 via-yellow-100 to-orange-300 border-none shadow-md rounded-2xl"
        >
          <CardContent className="p-3 sm:p-4 rounded-xl flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="flex flex-row flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-orange-950 font-inter truncate">{alert.job_title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(alert.job_type)} w-fit`}>
                    {alert.job_type}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 sm:gap-2 text-sm text-orange-900 font-inter">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{alert.location}, {alert.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="truncate">{alert.preferred_time} ({alert.timezone})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4" />
                    <span>{alert.alert_frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="">Max {alert.max_alerts_per_day} alerts/day</span>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-row gap-1 mt-2 sm:mt-0 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(alert)}
                  className="h-8 w-8 sm:w-auto px-2 text-xs border-orange-300 text-orange-900 hover:bg-orange-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(alert.id)}
                  className="h-8 w-8 sm:w-auto px-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default JobAlertsList;
