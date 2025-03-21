
import { User, UserRole } from "./auth";

export interface Project {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithAuthor extends Project {
  author: User;
}

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Optimized version with memoization support
export const getProjectPermissions = (
  project: Project | null,
  user: User | null
): ProjectPermissions => {
  if (!user || !project) {
    return { canView: false, canEdit: false, canDelete: false };
  }

  // Admin can do everything
  if (user.role === "Admin") {
    return { canView: true, canEdit: true, canDelete: true };
  }

  // Editor can edit all projects, but can only delete their own
  if (user.role === "Editor") {
    return { 
      canView: true, 
      canEdit: true, 
      canDelete: project.createdBy === user.id 
    };
  }

  // Viewer can only view projects
  return { canView: true, canEdit: false, canDelete: false };
};
