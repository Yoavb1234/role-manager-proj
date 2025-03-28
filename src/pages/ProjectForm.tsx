import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Save, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProject, createProject, updateProject, isLoading: contextLoading } = useProjects();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditMode = !!id;
  
  const fetchProject = useCallback(async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      const fetchedProject = await getProject(id);
      
      if (!fetchedProject) {
        toast.error("Project not found");
        navigate("/projects");
        return;
      }
      
      // For editing, Editors can only edit their own projects
      if (user.role === "Editor" && fetchedProject.createdBy !== user.id) {
        setPermissionDenied(true);
        return;
      }
      
      setTitle(fetchedProject.title);
      setContent(fetchedProject.content);
      
    } catch (error) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id, user, getProject, navigate]);
  
  // Check permissions and load project data
  useEffect(() => {
    if (!user) return;
    
    // Only Admins and Editors can create/edit projects
    if (user.role === "Viewer") {
      setPermissionDenied(true);
      return;
    }
    
    if (isEditMode) {
      fetchProject();
    } else {
      setLoading(false);
    }
  }, [user, isEditMode, fetchProject]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isEditMode && id) {
        await updateProject(id, title, content);
        toast.success("Project updated successfully");
        navigate(`/projects/${id}`);
      } else {
        const newProject = await createProject(title, content);
        toast.success("Project created successfully");
        navigate(`/projects/${newProject.id}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(isEditMode ? "Failed to update project" : "Failed to create project");
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (permissionDenied) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to {isEditMode ? "edit this project" : "create projects"}.
        </p>
        <Link to="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }
  
  if (loading || contextLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-muted-foreground hover:text-foreground flex items-center mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? "Edit Project" : "Create New Project"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEditMode ? "Update your project details" : "Add a new project to your collection"}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            required
            disabled={isSaving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter project content"
            className="min-h-[200px]"
            required
            disabled={isSaving}
          />
        </div>
        
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Update Project" : "Create Project"}
              </>
            )}
          </Button>
          <Link to={isEditMode ? `/projects/${id}` : "/projects"}>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
