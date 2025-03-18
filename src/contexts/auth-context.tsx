
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, AuthState, LoginCredentials, SignupCredentials, User, UserRole } from "@/types/auth";
import { toast } from "sonner";

// Mock API functions (in a real app, these would call your backend)
const mockUsers: User[] = [];

const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const user = mockUsers.find(u => u.email === credentials.email);
  
  if (!user || user.email !== credentials.email) {
    throw new Error("Invalid credentials");
  }
  
  // In a real app, you would verify the password here
  const token = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;
  return { user, token };
};

const mockSignup = async (credentials: SignupCredentials): Promise<{ user: User; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (mockUsers.some(u => u.email === credentials.email)) {
    throw new Error("Email already in use");
  }
  
  // Determine if this is the first user (who gets Admin role)
  const isFirstUser = mockUsers.length === 0;
  const role: UserRole = isFirstUser ? "Admin" : "Viewer";
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: credentials.email,
    name: credentials.name,
    role,
    createdAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  
  const token = `mock-jwt-token-${Math.random().toString(36).substring(2)}`;
  return { user: newUser, token };
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    // Check for stored token and user on initial load
    const storedToken = localStorage.getItem("auth-token");
    const storedUser = localStorage.getItem("auth-user");
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        setState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Ensure the user exists in our mock database
        if (!mockUsers.some(u => u.id === user.id)) {
          mockUsers.push(user);
        }
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
        setState({ ...initialState, isLoading: false });
      }
    } else {
      setState({ ...initialState, isLoading: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await mockLogin(credentials);
      
      localStorage.setItem("auth-token", token);
      localStorage.setItem("auth-user", JSON.stringify(user));
      
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Login failed", error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error("Invalid credentials");
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await mockSignup(credentials);
      
      localStorage.setItem("auth-token", token);
      localStorage.setItem("auth-user", JSON.stringify(user));
      
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success(`Welcome, ${user.name}! You've been registered as a${user.role === "Admin" ? "n" : ""} ${user.role}`);
    } catch (error) {
      console.error("Signup failed", error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create account");
      }
      
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedUser: User) => {
    // Update in mock database
    const userIndex = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    }
    
    // Update current user if it's the same user
    if (state.user && state.user.id === updatedUser.id) {
      localStorage.setItem("auth-user", JSON.stringify(updatedUser));
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Mock functions to manage users (for admin panel)
export const getAllUsers = async (): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockUsers];
};

export const updateUserRole = async (userId: string, newRole: UserRole, currentUser: User): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if current user is admin
  if (currentUser.role !== "Admin") {
    throw new Error("Only admins can update user roles");
  }
  
  // Find and update user
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error("User not found");
  }
  
  const updatedUser = { ...mockUsers[userIndex], role: newRole };
  mockUsers[userIndex] = updatedUser;
  
  return updatedUser;
};
