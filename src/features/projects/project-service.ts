
import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectWithAuthor } from "@/types/project";
import { User, UserRole } from "@/types/auth";

// Helper function to format a project from the database
export const formatProject = (data: any): Project => {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const createProjectService = async (title: string, content: string, userId: string): Promise<Project> => {
  const newProject = {
    title,
    content,
    created_by: userId
  };
  
  try {
    console.log("Creating project with data:", newProject);
    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }
    
    console.log("Project created successfully:", data);
    return formatProject(data);
  } catch (error) {
    console.error("Error in createProjectService:", error);
    throw error;
  }
};

export const updateProjectService = async (id: string, title: string, content: string): Promise<Project> => {
  const updates = {
    title,
    content,
    updated_at: new Date().toISOString()
  };
  
  try {
    console.log(`Updating project ${id} with data:`, updates);
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }
    
    console.log("Project updated successfully:", data);
    return formatProject(data);
  } catch (error) {
    console.error("Error in updateProjectService:", error);
    throw error;
  }
};

export const deleteProjectService = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting project ${id}`);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
    
    console.log("Project deleted successfully");
  } catch (error) {
    console.error("Error in deleteProjectService:", error);
    throw error;
  }
};

export const getProjectService = async (id: string): Promise<Project | null> => {
  try {
    console.log(`Fetching project ${id}`);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching project:", error);
      return null;
    }
    
    if (!data) {
      console.log(`No project found with id ${id}`);
      return null;
    }
    
    console.log("Project fetched successfully:", data);
    return formatProject(data);
  } catch (error) {
    console.error("Error in getProjectService:", error);
    return null;
  }
};

export const getAllProjectsService = async (): Promise<Project[]> => {
  try {
    console.log("Fetching all projects...");
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching all projects:", error);
      throw error;
    }
    
    console.log("Projects data from Supabase:", data);
    
    // Return empty array if no data
    if (!data || data.length === 0) {
      console.log("No projects found");
      return [];
    }
    
    return data.map(project => formatProject(project));
  } catch (error) {
    console.error("Error in getAllProjectsService:", error);
    // Return empty array instead of throwing error
    return [];
  }
};

export const getProjectWithAuthorService = async (id: string): Promise<ProjectWithAuthor | null> => {
  try {
    console.log(`Fetching project with author for id ${id}`);
    // First, fetch the project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (projectError) {
      console.error("Error fetching project:", projectError);
      return null;
    }
    
    if (!projectData) {
      console.log(`No project found with id ${id}`);
      return null;
    }
    
    // Then, fetch the author profile separately 
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', projectData.created_by)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching author profile:", profileError);
      // We'll still return the project even if we can't get the author
    }
    
    const author: User = profileData ? {
      id: profileData.id,
      email: '', // We don't store email in profiles
      name: profileData.name,
      role: profileData.role as UserRole, // Cast the role to UserRole type
      createdAt: profileData.created_at
    } : {
      id: projectData.created_by,
      email: '',
      name: 'Unknown user',
      role: 'Viewer' as UserRole, // Use a default UserRole
      createdAt: ''
    };
    
    console.log("Project with author fetched successfully");
    
    return {
      id: projectData.id,
      title: projectData.title,
      content: projectData.content,
      createdBy: projectData.created_by,
      createdAt: projectData.created_at,
      updatedAt: projectData.updated_at,
      author
    };
  } catch (error) {
    console.error("Failed to get project with author", error);
    return null;
  }
};
