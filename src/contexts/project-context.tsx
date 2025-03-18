
import React, { createContext, useContext, useState } from "react";
import { Project, ProjectWithAuthor } from "@/types/project";
import { User } from "@/types/auth";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { supabase } from "@/integrations/supabase/client";

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
      
      if (!user) throw new Error("User not authenticated");
      
      const newProject = {
        title,
        content,
        created_by: user.id
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();
      
      if (error) throw error;
      
      const formattedProject: Project = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
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
      checkPermission("update");
      
      if (!user) throw new Error("User not authenticated");
      
      const updates = {
        title,
        content,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const formattedProject: Project = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
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
      checkPermission("delete");
      
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching project:", error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error("Error in getProject:", error);
      return null;
    }
  };

  const getAllProjects = async (): Promise<Project[]> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedProjects: Project[] = data.map(project => ({
        id: project.id,
        title: project.title,
        content: project.content,
        createdBy: project.created_by,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }));
      
      return formattedProjects;
    } catch (error) {
      console.error("Error fetching all projects:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectWithAuthor = async (id: string): Promise<ProjectWithAuthor | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:created_by (id, name, role)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching project with author:", error);
        return null;
      }
      
      if (!data || !data.profiles) return null;
      
      const author: User = {
        id: data.profiles.id,
        email: '',
        name: data.profiles.name,
        role: data.profiles.role,
        createdAt: ''
      };
      
      return {
        id: data.id,
        title: data.title,
        content: data.content,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        author
      };
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
