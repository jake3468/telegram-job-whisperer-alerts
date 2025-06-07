
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, FileSearch } from 'lucide-react';

const DashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard = location.pathname === '/dashboard';
  const isOnJobGuide = location.pathname === '/job-guide';

  return (
    <nav className="flex items-center gap-4 mb-8">
      <Button
        variant={isOnDashboard ? "default" : "outline"}
        onClick={() => navigate('/dashboard')}
        className={`font-inter font-medium ${
          isOnDashboard 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0' 
            : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
        }`}
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </Button>
      
      <Button
        variant={isOnJobGuide ? "default" : "outline"}
        onClick={() => navigate('/job-guide')}
        className={`font-inter font-medium ${
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
