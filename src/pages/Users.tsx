
import React, { useEffect, useState } from "react";
import { useAuth, getAllUsers, updateUserRole } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, UserCog, Shield, ShieldAlert } from "lucide-react";
import { User, UserRole } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser?.role !== "Admin") {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentUser]);
  
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== "Admin") {
      toast.error("Only admins can change user roles");
      return;
    }
    
    try {
      const updatedUser = await updateUserRole(userId, newRole, currentUser);
      
      // Update the local users state
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update user role");
      }
    }
  };
  
  // Access denied for non-admins
  if (currentUser?.role !== "Admin") {
    return (
      <div className="text-center py-12 space-y-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">
          You need administrator privileges to access this page.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles and permissions
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <CardTitle>Users</CardTitle>
          </div>
          <CardDescription>
            View and update the roles for all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.role === "Admin" && <Shield className="h-4 w-4 text-primary" />}
                        {user.role === "Editor" && <UserCog className="h-4 w-4 text-primary" />}
                        {user.role === "Viewer" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                        <span>{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={user.id === currentUser.id} // Can't change own role
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Role Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                Admin
              </h3>
              <p className="text-muted-foreground text-sm">
                Full access to all parts of the system. Can manage users, create, edit, and delete projects.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <UserCog className="h-4 w-4 mr-2 text-primary" />
                Editor
              </h3>
              <p className="text-muted-foreground text-sm">
                Can create, edit all projects, but can only delete their own projects. Cannot manage users.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                Viewer
              </h3>
              <p className="text-muted-foreground text-sm">
                Read-only access to all projects. Cannot create, edit, or delete projects. Cannot manage users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
