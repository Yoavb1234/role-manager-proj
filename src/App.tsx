
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { ProjectProvider } from "@/features/projects/project-context";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Layouts
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";

// Pages
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import ProjectForm from "@/pages/ProjectForm";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1
    }
  }
});

const App = () => {
  useEffect(() => {
    const verifyDatabase = async () => {
      console.log("Verifying database tables...");
      
      try {
        // Check profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
          
        if (profilesError) {
          console.error("Profiles table error:", profilesError);
        } else {
          console.log("Profiles table exists");
        }
        
        // Check projects table
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('count', { count: 'exact', head: true });
          
        if (projectsError) {
          console.error("Projects table error:", projectsError);
        } else {
          console.log("Projects table exists");
        }
      } catch (error) {
        console.error("Database verification error:", error);
      }
    };
    
    verifyDatabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>
                
                {/* Protected routes */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/new" element={<ProjectForm />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/projects/:id/edit" element={<ProjectForm />} />
                  <Route path="/users" element={<Users />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
