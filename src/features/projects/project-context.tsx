
import React, { createContext, useContext, useState } from "react";
import { Project, ProjectWithAuthor } from "@/types/project";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { ProjectContextType } from "./types";
import { 
  createProjectService,
  updateProjectService,
  deleteProjectService,
  getProjectService,
  getAllProjectsService,
  getProjectWithAuthorService
} from "./project-service";
import { useProjectPermissions } from "./use-project-permissions";

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  isLoading: false,
  createProject: async () => ({ id: "", title: "", content: "", createdBy: "", createdAt: "", updatedAt: "" }),
  updateProject: async () => ({ id: "", title: "", content: "", createdBy: "", createdAt: "", updatedAt: "" }),
  deleteProject: async () => {},
  getProject: async () => null,
  getAllProjects: async () => [],
  getProjectWithAuthor: async () => null,
});

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { checkPermission } = useProjectPermissions();

  const createProject = async (title: string, content: string): Promise<Project> => {
    setIsLoading(true);
    
    try {
      // Check permission
      checkPermission(user, "create");
      
      if (!user) throw new Error("User not authenticated");
      
      const formattedProject = await createProjectService(title, content, user.id);
      
      // Update local state
      setProjects(prev => [formattedProject, ...prev]);
      
      toast.success("Project created successfully");
      return formattedProject;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create project");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, title: string, content: string): Promise<Project> => {
    setIsLoading(true);
    
    try {
      // Check permission
      checkPermission(user, "update");
      
      if (!user) throw new Error("User not authenticated");
      
      const formattedProject = await updateProjectService(id, title, content);
      
      // Update local state
      setProjects(prev => prev.map(p => p.id === id ? formattedProject : p));
      
      toast.success("Project updated successfully");
      return formattedProject;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update project");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Check permission
      checkPermission(user, "delete");
      
      if (!user) throw new Error("User not authenticated");
      
      await deleteProjectService(id);
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== id));
      
      toast.success("Project deleted successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete project");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getProject = async (id: string): Promise<Project | null> => {
    try {
      // First try to find the project in local state
      const localProject = projects.find(p => p.id === id);
      if (localProject) return localProject;
      
      return await getProjectService(id);
    } catch (error) {
      console.error("Error in getProject:", error);
      return null;
    }
  };

  const getAllProjects = async (): Promise<Project[]> => {
    setIsLoading(true);
    
    try {
      const formattedProjects = await getAllProjectsService();
      
      // Update local state
      setProjects(formattedProjects);
      
      return formattedProjects;
    } catch (error) {
      console.error("Error fetching all projects:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectWithAuthor = async (id: string): Promise<ProjectWithAuthor | null> => {
    return await getProjectWithAuthorService(id);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        createProject,
        updateProject,
        deleteProject,
        getProject,
        getAllProjects,
        getProjectWithAuthor,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);
