
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
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
}

const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

export const JwtAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwtToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('jwtToken');
      if (storedToken) {
        try {
          // Verify token and get user data
          const { user } = await api.getCurrentUser(storedToken);
          setUser(user);
          setToken(storedToken);
        } catch (error) {
          console.error('Error verifying authentication token:', error);
          // Clear invalid token
          localStorage.removeItem('jwtToken');
          setToken(null);
          setUser(null);
        }
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
      
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      
      navigate('/');
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
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate('/');
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
