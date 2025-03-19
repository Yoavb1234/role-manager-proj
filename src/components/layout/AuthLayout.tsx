
import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [extendedTimeout, setExtendedTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/projects", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Add timeout for loading state
  useEffect(() => {
    let timeoutId: number;
    let extendedTimeoutId: number;
    
    if (isLoading) {
      timeoutId = window.setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
      
      extendedTimeoutId = window.setTimeout(() => {
        setExtendedTimeout(true);
      }, 15000); // 15 seconds for extended timeout
    }
    
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(extendedTimeoutId);
    };
  }, [isLoading]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Display an error message if loading times out
  if ((isLoading && loadingTimeout) || extendedTimeout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connection to the server is taking longer than expected. Please refresh the page or try again later.
          </AlertDescription>
        </Alert>
        <button 
          onClick={() => window.location.reload()} 
          className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Don't render anything as we're redirecting in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 animate-scale-in">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
