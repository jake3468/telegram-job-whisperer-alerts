
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
  // More muted, pastel job type color chips
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'Remote':
        return 'bg-orange-200 text-orange-700';
      case 'On-site':
        return 'bg-yellow-200 text-yellow-700';
      case 'Hybrid':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map(alert =>
        <Card
          key={alert.id}
          // Less bright, compact, pastel orange-brown gradient
          className="
            bg-gradient-to-br from-[#fec89a] via-[#f77f00]/50 to-[#bc6c25]/20
            border border-orange-300/60 shadow
            rounded-xl sm:rounded-2xl
            p-0
          "
        >
          <CardContent
            className="
              flex flex-col
              p-3 sm:p-4
              rounded-xl
              text-orange-950
              gap-2
              sm:gap-3
            "
            style={{ minHeight: 0 }} // Remove forced height
          >
            <div className="flex flex-row gap-2 justify-between items-start w-full">
              {/* MAIN (info) */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <h3 className="text-base sm:text-lg font-semibold font-inter truncate">{alert.job_title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(alert.job_type)} w-fit`}>
                    {alert.job_type}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm font-inter">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 sm:w-4 sm:h-4 text-orange-700" />
                    <span className="truncate">{alert.location}, {alert.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-orange-700" />
                    <span className="truncate">{alert.preferred_time} ({alert.timezone})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 sm:w-4 sm:h-4 text-orange-700" />
                    <span>{alert.alert_frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Max {alert.max_alerts_per_day} alerts/day</span>
                  </div>
                </div>
              </div>
              {/* Action Buttons, tight spacing and size */}
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(alert)}
                  className="h-8 w-8 p-0 border-orange-300 text-orange-700 hover:bg-orange-50 transition"
                  aria-label="Edit Alert"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(alert.id)}
                  className="h-8 w-8 p-0"
                  aria-label="Delete Alert"
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
