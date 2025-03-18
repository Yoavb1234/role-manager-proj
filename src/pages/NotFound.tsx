
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4 py-8 animate-fade-in">
        <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground" />
        <div>
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/dashboard">
          <Button className="min-w-[120px]">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
