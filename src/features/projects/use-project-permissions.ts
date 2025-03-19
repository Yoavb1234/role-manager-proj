
import { User } from "@/types/auth";

// Helper function to check permissions
export const useProjectPermissions = () => {
  const checkPermission = (user: User | null, action: "create" | "update" | "delete") => {
    if (!user) {
      throw new Error("You must be logged in");
    }
    
    if (user.role === "Viewer" && (action === "create" || action === "update" || action === "delete")) {
      throw new Error("Viewers don't have permission to " + action + " projects");
    }
  };

  return { checkPermission };
};
