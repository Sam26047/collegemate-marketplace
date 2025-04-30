
import { supabase } from '@/integrations/supabase/client';

const API_URL = "https://apkkklwenihriulmjtzy.supabase.co/functions/v1/auth";

interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name?: string;
    email: string;
  };
  token: string;
  message: string;
}

export const api = {
  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.getSession()}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    return await response.json();
  },

  login: async (params: LoginParams): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    return await response.json();
  },

  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get user data');
    }

    return await response.json();
  }
};

// Authentication middleware for protected routes
export const authMiddleware = {
  requireAuth: (next: Function) => {
    const token = localStorage.getItem('jwtToken');
    
    if (!token) {
      window.location.href = '/auth';
      return null;
    }
    
    return next();
  }
};
