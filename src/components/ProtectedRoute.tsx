import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show skeleton while auth is being checked - non-blocking
  if (!isLoaded) {
    return <PageSkeleton />;
  }

  // If not signed in, show skeleton during redirect
  if (!isSignedIn) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
};