
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/types/project";
import { Plus, Search, FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { getAllProjects, isLoading } = useProjects();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectAuthors, setProjectAuthors] = useState<Record<string, string>>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const canCreateProjects = user?.role === "Admin" || user?.role === "Editor";
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    // Add timeout for loading state
    timeoutId = setTimeout(() => {
      if (isMounted && isPageLoading) {
        setLoadingTimeout(true);
        setLoadingError("Loading is taking longer than expected. There might be connectivity issues with the database.");
      }
    }, 8000); // 8 seconds timeout
    
    const fetchProjects = async () => {
      try {
        setIsPageLoading(true);
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn("Projects fetch timeout - forcing completion");
            setIsPageLoading(false);
            setInitialLoadComplete(true);
          }
        }, 10000);
        
        console.log("Fetching projects...");
        setLoadingProgress(10);
        
        // Test Supabase connection first
        try {
          const { data: connectionTest, error: connectionError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
            .maybeSingle();
            
          if (connectionError) {
            console.error("Supabase connection test failed:", connectionError);
            if (isMounted) {
              setLoadingError("Failed to connect to the database. Please try again later.");
              setIsPageLoading(false);
              setInitialLoadComplete(true);
            }
            return;
          }
          
          setLoadingProgress(30);
        } catch (connError) {
          console.error("Supabase connection exception:", connError);
          if (isMounted) {
            setLoadingError("Failed to connect to the database. Please try again later.");
            setIsPageLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }
        
        // Proceed with actual data fetching
        console.log("Fetching projects...");
        const allProjects = await getAllProjects();
        
        if (!isMounted) return;
        
        console.log("Projects fetched:", allProjects.length);
        setLoadingProgress(60);
        setProjects(allProjects);
        
        // Only fetch authors if we have projects and are still mounted
        if (allProjects.length > 0 && isMounted) {
          try {
            const uniqueAuthorIds = [...new Set(allProjects.map(p => p.createdBy))];
            
            console.log("Fetching authors for IDs:", uniqueAuthorIds);
            const { data, error } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', uniqueAuthorIds);
            
            if (!isMounted) return;
            setLoadingProgress(90);
            
            if (error) {
              console.error("Error fetching authors:", error);
            } else if (data) {
              console.log("Authors fetched:", data.length);
              const authorsMap: Record<string, string> = {};
              data.forEach(profile => {
                authorsMap[profile.id] = profile.name;
              });
              setProjectAuthors(authorsMap);
            }
          } catch (authorError) {
            console.error("Exception fetching authors:", authorError);
          }
        }
      } catch (error) {
        console.error("Error in fetchProjects:", error);
        if (isMounted) {
          setLoadingError("Failed to load projects. Please try refreshing the page.");
        }
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoadingProgress(100);
          setInitialLoadComplete(true);
          setIsPageLoading(false);
        }
      }
    };
    
    fetchProjects();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [getAllProjects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);
  
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground mb-4">Loading projects...</p>
      <div className="w-full max-w-md mb-2">
        <Progress value={loadingProgress} className="h-2" />
      </div>
      {loadingTimeout && (
        <Alert variant="destructive" className="mt-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {loadingError || "Loading is taking longer than expected. There might be connectivity issues."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
  
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <p className="text-xl font-medium mb-2">Error Loading Projects</p>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {loadingError || "There was a problem loading the projects. Please try again later."}
      </p>
      <Button onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  );
  
  if (isPageLoading) {
    return renderLoading();
  }
  
  if (loadingError && !isPageLoading) {
    return renderError();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {canCreateProjects
              ? "Browse, create and manage your projects"
              : "Browse and view available projects"}
          </p>
        </div>
        
        {canCreateProjects && (
          <Link to="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {initialLoadComplete && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
          <p className="text-xl font-medium mb-2">No projects found</p>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Try searching with different keywords"
              : canCreateProjects
              ? "Create your first project to get started"
              : "No projects are available for viewing"}
          </p>
          
          {canCreateProjects && !searchQuery && (
            <Link to="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            </Link>
          )}
        </div>
      )}
      
      {filteredProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                      <p className="text-muted-foreground line-clamp-3 text-sm mb-4">
                        {project.content.length > 150
                          ? `${project.content.substring(0, 150)}...`
                          : project.content}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {projectAuthors[project.createdBy] && (
                        <p className="text-sm text-muted-foreground">
                          Created by: <span className="font-medium">{projectAuthors[project.createdBy]}</span>
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
