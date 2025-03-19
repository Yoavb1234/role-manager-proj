
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useProjects } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/types/project";
import { Plus, Search, FolderOpen, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const Projects: React.FC = () => {
  const { user } = useAuth();
  const { getAllProjects, isLoading } = useProjects();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectAuthors, setProjectAuthors] = useState<Record<string, string>>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const canCreateProjects = user?.role === "Admin" || user?.role === "Editor";
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchProjects = async () => {
      try {
        setIsPageLoading(true);
        const allProjects = await getAllProjects();
        
        if (!isMounted) return;
        
        setProjects(allProjects);
        
        // Batch fetch author names to improve performance
        if (allProjects.length > 0) {
          const uniqueAuthorIds = [...new Set(allProjects.map(p => p.createdBy))];
          
          const { data } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueAuthorIds);
          
          if (!isMounted) return;
          
          if (data) {
            const authorsMap: Record<string, string> = {};
            data.forEach(profile => {
              authorsMap[profile.id] = profile.name;
            });
            setProjectAuthors(authorsMap);
          }
        }
      } catch (error) {
        console.error("Error in fetchProjects:", error);
      } finally {
        if (isMounted) {
          setInitialLoadComplete(true);
          setIsPageLoading(false);
        }
      }
    };
    
    fetchProjects();
    
    return () => {
      isMounted = false;
    };
  }, [getAllProjects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);
  
  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
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
