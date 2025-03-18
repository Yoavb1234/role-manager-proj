
import React, { createContext, useContext, useState } from "react";
import { Project, ProjectWithAuthor } from "@/types/project";
import { User } from "@/types/auth";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  createProject: (title: string, content: string) => Promise<Project>;
  updateProject: (id: string, title: string, content: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Promise<Project | null>;
  getAllProjects: () => Promise<Project[]>;
  getProjectWithAuthor: (id: string) => Promise<ProjectWithAuthor | null>;
}

// Mock data
const mockProjects: Project[] = [];

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
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Helper function to check permissions
  const checkPermission = (action: "create" | "update" | "delete") => {
    if (!user) {
      throw new Error("You must be logged in");
    }
    
    if (user.role === "Viewer" && (action === "create" || action === "update" || action === "delete")) {
      throw new Error("Viewers don't have permission to " + action + " projects");
    }
  };

  const createProject = async (title: string, content: string): Promise<Project> => {
    setIsLoading(true);
    
    try {
      // Check permission
      checkPermission("create");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const now = new Date().toISOString();
      const newProject: Project = {
        id: `project-${Date.now()}`,
        title,
        content,
        createdBy: user!.id,
        createdAt: now,
        updatedAt: now,
      };
      
      // Add to mock database
      mockProjects.push(newProject);
      setProjects([...mockProjects]);
      
      toast.success("Project created successfully");
      return newProject;
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
      checkPermission("update");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find project
      const projectIndex = mockProjects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error("Project not found");
      }
      
      // Only admin/editor can edit projects
      if (user!.role === "Viewer") {
        throw new Error("Viewers cannot edit projects");
      }
      
      // Editors can only edit their own projects unless they're admins
      if (user!.role === "Editor" && mockProjects[projectIndex].createdBy !== user!.id) {
        throw new Error("You can only edit your own projects");
      }
      
      const updatedProject = {
        ...mockProjects[projectIndex],
        title,
        content,
        updatedAt: new Date().toISOString(),
      };
      
      // Update in mock database
      mockProjects[projectIndex] = updatedProject;
      setProjects([...mockProjects]);
      
      toast.success("Project updated successfully");
      return updatedProject;
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
      checkPermission("delete");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find project
      const projectIndex = mockProjects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error("Project not found");
      }
      
      // Editors can only delete their own projects
      if (user!.role === "Editor" && mockProjects[projectIndex].createdBy !== user!.id) {
        throw new Error("You can only delete your own projects");
      }
      
      // Remove from mock database
      mockProjects.splice(projectIndex, 1);
      setProjects([...mockProjects]);
      
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.find(p => p.id === id) || null;
  };

  const getAllProjects = async (): Promise<Project[]> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return all projects (in a real app, we'd filter based on permissions)
      return [...mockProjects];
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectWithAuthor = async (id: string): Promise<ProjectWithAuthor | null> => {
    try {
      const project = await getProject(id);
      if (!project) return null;
      
      // Get author info from auth context
      // This is a simplification - in a real app, you'd get the user from your backend
      const { getAllUsers } = await import("./auth-context");
      const users = await getAllUsers();
      const author = users.find(u => u.id === project.createdBy) as User;
      
      if (!author) return null;
      
      return { ...project, author };
    } catch (error) {
      console.error("Failed to get project with author", error);
      return null;
    }
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
