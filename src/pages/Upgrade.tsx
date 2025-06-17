
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Upgrade = () => {
  const navigate = useNavigate();

  // Auto-redirect to get more credits page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/get-more-credits');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="
      min-h-screen flex flex-col items-center justify-center
      bg-gradient-to-br from-fuchsia-900 via-fuchsia-700 to-indigo-900
      px-2
    ">
      <Card className="max-w-sm w-full border-fuchsia-400/20 shadow-2xl bg-black bg-opacity-80">
        <CardHeader>
          <CardTitle className="text-fuchsia-400 text-center">Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white text-sm text-center">
          <p>Taking you to the Get More Credits page...</p>
          <div className="flex flex-col gap-2">
            <Button 
              className="w-full bg-fuchsia-700 hover:bg-fuchsia-800" 
              onClick={() => navigate('/get-more-credits')}
            >
              Go to Get More Credits
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white bg-transparent hover:bg-white/10" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upgrade;
