
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name?: string;
  email: string;
}

interface JwtAuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  redirectPath: string;
  setRedirectPath: (path: string) => void;
}

const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

export const JwtAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [redirectPath, setRedirectPath] = useState<string>('/');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      // Check if there's a token in localStorage
      const storedToken = localStorage.getItem('jwtToken');
      
      if (storedToken) {
        try {
          console.log("Found stored token, verifying...");
          // Set token first to ensure it's available for API calls
          setToken(storedToken);
          
          // Verify the token and get user data
          const userData = await api.getCurrentUser(storedToken);
          console.log("Token verification successful", userData);
          setUser(userData.user);
          
          // Configure Supabase client with token after verification
          await api.setupSupabaseSession(storedToken);
        } catch (error) {
          // If token verification fails, clear storage
          console.error('Token verification failed:', error);
          localStorage.removeItem('jwtToken');
          setToken(null);
          setUser(null);
        }
      } else {
        // No token found
        console.log("No token found in localStorage");
        setToken(null);
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.register({ name, email, password });
      
      // Store token and user data
      localStorage.setItem('jwtToken', response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Set up Supabase session with the token
      await api.setupSupabaseSession(response.token);
      
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      
      // Navigate to the stored redirect path or home
      navigate(redirectPath || '/');
      // Reset redirect path after successful navigation
      setRedirectPath('/');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login({ email, password });
      
      // Store token and user data
      localStorage.setItem('jwtToken', response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Set up Supabase session with the token
      await api.setupSupabaseSession(response.token);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      // Navigate to the stored redirect path or home
      navigate(redirectPath || '/');
      // Reset redirect path after successful navigation
      setRedirectPath('/');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
    setUser(null);
    
    // Clear Supabase session
    api.clearSupabaseSession();
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    
    navigate('/auth');
  };

  const value = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    redirectPath,
    setRedirectPath
  };

  return <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>;
};

export const useJwtAuth = () => {
  const context = useContext(JwtAuthContext);
  if (context === undefined) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
};
