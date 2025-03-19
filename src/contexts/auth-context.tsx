
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, AuthState, LoginCredentials, SignupCredentials, User, UserRole } from "@/types/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log(`Fetching profile for user: ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();  // Use maybeSingle instead of single to prevent errors

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('No profile found for user:', userId);
        return null;
      }

      console.log('Profile found:', data);
      return {
        id: data.id,
        email: '', // Will be populated from auth.user
        name: data.name,
        role: data.role as UserRole,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: number;
    
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error checking session:', error);
          setState({
            ...initialState,
            isLoading: false,
          });
          return;
        }

        if (session) {
          console.log('Session found:', session);
          const { user: authUser } = session;
          
          try {
            const profile = await fetchUserProfile(authUser.id);
            
            if (!isMounted) return;
            
            if (profile) {
              const user: User = {
                ...profile,
                email: authUser.email || '',
              };

              setState({
                user,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Even if profile fetch fails, create a basic user
              console.log('No profile found, creating basic user');
              const user: User = {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.email?.split('@')[0] || 'User',
                role: 'Viewer',
                createdAt: new Date().toISOString(),
              };
              
              setState({
                user,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (profileError) {
            console.error('Error in profile fetch:', profileError);
            setState({
              ...initialState,
              isLoading: false,
            });
          }
        } else {
          // No session found
          console.log('No session found');
          setState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (isMounted) {
          setState({
            ...initialState,
            isLoading: false,
          });
        }
      }
    };

    checkSession();
    
    // Set a timeout to ensure loading state doesn't get stuck
    timeoutId = window.setTimeout(() => {
      if (isMounted && state.isLoading) {
        console.warn('Auth loading timed out - forcing completion');
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    }, 10000); // 10 second timeout

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          const { user: authUser } = session;
          try {
            const profile = await fetchUserProfile(authUser.id);
            
            if (!isMounted) return;
            
            if (profile) {
              const user: User = {
                ...profile,
                email: authUser.email || '',
              };

              setState({
                user,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Fallback user
              const user: User = {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.email?.split('@')[0] || 'User',
                role: 'Viewer',
                createdAt: new Date().toISOString(),
              };
              
              setState({
                user,
                token: session.access_token,
                isAuthenticated: true,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error during sign in:', error);
            setState(prev => ({ ...prev, isLoading: false }));
          }
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) throw error;
      
      // Auth state listener will handle state update
      toast.success("Logged in successfully");
    } catch (error: any) {
      console.error("Login failed:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.message || "Invalid credentials";
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      
      if (error) throw error;
      
      toast.success("Registration successful! Please check your email to confirm your account.");
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error("Signup failed:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.message || "Failed to create account";
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out");
    }
  };

  const updateUser = async (updatedUser: User) => {
    if (!state.user || state.user.id !== updatedUser.id) {
      return;
    }

    try {
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: updatedUser.name,
          role: updatedUser.role 
        })
        .eq('id', updatedUser.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      toast.success("User profile updated successfully");
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user profile");
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

// Functions for user management (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    // We don't have emails in profiles table, so we'll create users with empty emails
    const users: User[] = profiles.map(profile => ({
      id: profile.id,
      email: '', // Empty email for now
      name: profile.name,
      role: profile.role as UserRole,
      createdAt: profile.created_at,
    }));

    return users;
  } catch (error) {
    console.error("Failed to get all users:", error);
    toast.error("Failed to load users");
    return [];
  }
};

export const updateUserRole = async (userId: string, newRole: UserRole, currentUser: User): Promise<User> => {
  if (currentUser.role !== "Admin") {
    throw new Error("Only admins can update user roles");
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      email: '', // We don't have this in the response
      name: data.name,
      role: data.role as UserRole,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Failed to update user role:", error);
    toast.error("Failed to update user role");
    throw error;
  }
};
