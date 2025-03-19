
import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import Navbar from "./Navbar";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [extendedTimeout, setExtendedTimeout] = useState(false);

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

  // If loading is taking too long, show a spinner
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <div className="flex gap-4 mt-2">
          <button 
            onClick={() => window.location.reload()} 
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => {
              // Try to manually test the connection
              (window as any).testSupabaseConnection?.();
              // Force state reset
              setExtendedTimeout(false);
              setLoadingTimeout(false);
              // Redirect to login
              window.location.href = '/login';
            }} 
            className="rounded bg-secondary px-4 py-2 text-white hover:bg-secondary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
