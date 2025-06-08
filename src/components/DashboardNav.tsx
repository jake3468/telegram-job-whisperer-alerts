
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Bell, FileSearch } from 'lucide-react';

const DashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOnProfile = location.pathname === '/dashboard';
  const isOnJobAlerts = location.pathname === '/job-alerts';
  const isOnJobGuide = location.pathname === '/job-guide';

  return (
    <nav className="flex flex-col sm:flex-row items-center gap-4 mb-8">
      <Button
        variant={isOnProfile ? "default" : "outline"}
        onClick={() => navigate('/dashboard')}
        className={`font-inter font-medium w-full sm:w-auto ${
          isOnProfile 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0' 
            : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
        }`}
      >
        <User className="w-4 h-4 mr-2" />
        Profile
      </Button>
      
      <Button
        variant={isOnJobAlerts ? "default" : "outline"}
        onClick={() => navigate('/job-alerts')}
        className={`font-inter font-medium w-full sm:w-auto ${
          isOnJobAlerts 
            ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white border-0' 
            : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
        }`}
      >
        <Bell className="w-4 h-4 mr-2" />
        Job Alerts
      </Button>
      
      <Button
        variant={isOnJobGuide ? "default" : "outline"}
        onClick={() => navigate('/job-guide')}
        className={`font-inter font-medium w-full sm:w-auto ${
          isOnJobGuide 
            ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-0' 
            : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
        }`}
      >
        <FileSearch className="w-4 h-4 mr-2" />
        Job Guide
      </Button>
    </nav>
  );
};

export default DashboardNav;
