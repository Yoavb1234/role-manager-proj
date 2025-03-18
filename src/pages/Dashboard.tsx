
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useProjects } from "@/contexts/project-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@/types/project";
import { FileText, Plus, Users } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getAllProjects, isLoading } = useProjects();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    const fetchProjects = async () => {
      const allProjects = await getAllProjects();
      setProjects(allProjects);
      
      if (user) {
        // Filter user's own projects if they're an Editor
        const ownProjects = user.role === "Editor" 
          ? allProjects.filter(p => p.createdBy === user.id)
          : allProjects;
        
        setUserProjects(ownProjects);
      }
    };
    
    fetchProjects();
  }, [getAllProjects, user]);
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">
          You're logged in as <span className="font-medium">{user?.role}</span>
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Projects
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                `Total of ${projects.length} projects`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-10 w-16" /> : projects.length}
              </span>
              <Link to="/projects">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {(user?.role === "Admin" || user?.role === "Editor") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                My Projects
              </CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `You've created ${userProjects.length} projects`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-10 w-16" /> : userProjects.length}
                </span>
                <Link to="/projects/new">
                  <Button variant="default" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Project
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        
        {user?.role === "Admin" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Control user access and permissions
                </span>
                <Link to="/users">
                  <Button variant="outline" size="sm">
                    Manage Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="transition-all hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No projects found</p>
            {(user?.role === "Admin" || user?.role === "Editor") && (
              <Link to="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first project
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
