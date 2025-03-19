
import { User } from "@/types/auth";
import { toast } from "sonner";

// Helper function to check permissions
export const useProjectPermissions = () => {
  const checkPermission = (user: User | null, action: "create" | "update" | "delete") => {
    if (!user) {
      console.error("Permission check failed: No user");
      throw new Error("You must be logged in");
    }
    
    console.log(`Checking permission for ${action} with role ${user.role}`);
    
    if (user.role === "Viewer" && (action === "create" || action === "update" || action === "delete")) {
      console.warn(`Permission denied: Viewers cannot ${action} projects`);
      throw new Error(`Viewers don't have permission to ${action} projects`);
    }
    
    // For Editors, they can only delete their own projects (handled elsewhere)
    return true;
  };

  return { checkPermission };
};
