
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
  
  const { data, error } = await supabase
    .from('projects')
    .insert(newProject)
    .select()
    .single();
  
  if (error) throw error;
  
  return formatProject(data);
};

export const updateProjectService = async (id: string, title: string, content: string): Promise<Project> => {
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
  
  return formatProject(data);
};

export const deleteProjectService = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getProjectService = async (id: string): Promise<Project | null> => {
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
  
  return formatProject(data);
};

export const getAllProjectsService = async (): Promise<Project[]> => {
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
  
  return data.map(project => formatProject(project));
};

export const getProjectWithAuthorService = async (id: string): Promise<ProjectWithAuthor | null> => {
  try {
    // First, fetch the project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) {
      console.error("Error fetching project:", projectError);
      return null;
    }
    
    if (!projectData) return null;
    
    // Then, fetch the author profile separately 
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', projectData.created_by)
      .single();
    
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
