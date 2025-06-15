
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Upgrade = () => {
  const navigate = useNavigate();
  return (
    <div className="
      min-h-screen flex flex-col items-center justify-center
      bg-gradient-to-br from-fuchsia-900 via-fuchsia-700 to-indigo-900
      px-2
    ">
      <Card className="max-w-md w-full border-fuchsia-400/20 shadow-2xl bg-black bg-opacity-80">
        <CardHeader>
          <CardTitle className="text-fuchsia-400">Upgrade your plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white text-base">
          <p>Your current credits are insufficient to access this feature.</p>
          <ul className="list-disc pl-8">
            <li>Free Plan: 15 credits, resets every 30 days</li>
            <li>Premium: 200 credits/month (coming soon)</li>
            <li>Credit Packs: Buy extra credits any time (coming soon)</li>
          </ul>
          <div>
            <Button className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 mt-2" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Upgrade;
