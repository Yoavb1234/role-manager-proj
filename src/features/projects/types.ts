
import { Project, ProjectWithAuthor } from "@/types/project";

export interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  createProject: (title: string, content: string) => Promise<Project>;
  updateProject: (id: string, title: string, content: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Promise<Project | null>;
  getAllProjects: () => Promise<Project[]>;
  getProjectWithAuthor: (id: string) => Promise<ProjectWithAuthor | null>;
}
