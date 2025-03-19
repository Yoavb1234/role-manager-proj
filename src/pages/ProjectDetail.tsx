
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useProjects } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectWithAuthor, getProjectPermissions } from "@/types/project";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Edit, Trash, User } from "lucide-react";
import { toast } from "sonner";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProjectWithAuthor, deleteProject } = useProjects();
  const [project, setProject] = useState<ProjectWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const fetchedProject = await getProjectWithAuthor(id);
        
        if (isMounted) {
          setProject(fetchedProject);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to load project");
          console.error(error);
          setLoading(false);
        }
      }
    };
    
    fetchProject();
    
    return () => {
      isMounted = false;
    };
  }, [id, getProjectWithAuthor]);
  
  const permissions = getProjectPermissions(project, user);
  
  const handleDeleteProject = async () => {
    if (!id) return;
    
    try {
      await deleteProject(id);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete project");
      }
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-6 w-full mt-4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-32 w-full mt-6" />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-3">Project Not Found</h2>
        <p className="text-muted-foreground mb-5">The project you are looking for doesn't exist or has been deleted.</p>
        <Link to="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/projects" className="text-muted-foreground hover:text-foreground flex items-center mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 text-muted-foreground">
            {project.author && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Created by {project.author.name}</span>
              </div>
            )}
            <div className="hidden sm:block">•</div>
            <div>Last updated on {new Date(project.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {permissions.canEdit && (
            <Link to={`/projects/${project.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          
          {permissions.canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{project.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <div className="border rounded-lg p-6 bg-card/50">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{project.content}</pre>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
