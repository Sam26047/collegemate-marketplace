
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

// Product interfaces
export interface ProductCreate {
  title: string;
  description?: string;
  price: number;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category: string;
  location?: string;
  image_url?: string;
  image_urls?: string[];
}

export interface ProductUpdate extends Partial<ProductCreate> {
  id: string;
  status?: 'active' | 'sold' | 'inactive';
}

export interface ProductFilter {
  category?: string;
  search?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export const api = {
  // Set up Supabase session with JWT token
  setupSupabaseSession: async (token: string) => {
    try {
      console.log('Setting up Supabase session with token');
      // Set the JWT token in the Supabase client
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // Using the same token as both for simplicity
      });
      
      if (error) {
        console.error('Error setting Supabase session:', error);
        throw error;
      }
      
      console.log('Supabase session established successfully', data);
      return data;
    } catch (error) {
      console.error('Failed to set up Supabase session:', error);
      throw error;
    }
  },

  // Clear Supabase session (for logout)
  clearSupabaseSession: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to clear Supabase session:', error);
    }
  },

  // Authentication API methods
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
  },

  // Products API methods
  products: {
    // Create a new product listing
    create: async (productData: ProductCreate) => {
      // Get the current user session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('Session check failed - user not logged in');
        // Try to get JWT token from localStorage as a fallback
        const jwtToken = localStorage.getItem('jwtToken');
        
        if (jwtToken) {
          console.log('Found JWT token in localStorage, trying to establish session');
          // Attempt to establish Supabase session with JWT
          await api.setupSupabaseSession(jwtToken);
          
          // Try to get session again
          const { data: refreshedSession } = await supabase.auth.getSession();
          if (!refreshedSession.session) {
            console.error('Still no valid session after token refresh attempt');
            throw new Error('User must be logged in to create a product');
          }
          
          console.log('Session established successfully', refreshedSession);
        } else {
          throw new Error('User must be logged in to create a product');
        }
      }
      
      // Get the refreshed session
      const { data: currentSession } = await supabase.auth.getSession();
      const userId = currentSession.session?.user.id;
      
      if (!userId) {
        console.error('User ID not found in session');
        throw new Error('User authentication issue - please log in again');
      }
      
      console.log('Creating product with user ID:', userId);
      console.log('Product data:', productData);
      
      try {
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...productData,
            seller_id: userId,
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating product:', error);
          throw new Error(error.message);
        }
        
        console.log('Product created successfully:', data);
        return data;
      } catch (error: any) {
        console.error('Exception during product creation:', error);
        throw error;
      }
    },

    // Get a product by ID
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(username)')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    // Update a product
    update: async (productData: ProductUpdate) => {
      const { id, ...updateData } = productData;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    // Delete a product
    delete: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return { success: true };
    },

    // List products with filtering, search, and pagination
    list: async (filters: ProductFilter = {}) => {
      const {
        category,
        search,
        condition,
        min_price,
        max_price,
        page = 1,
        limit = 20
      } = filters;

      let query = supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(username)', { count: 'exact' })
        .eq('status', 'active');

      // Apply filters if provided
      if (category) {
        query = query.eq('category', category);
      }

      if (condition) {
        // Fix: Type cast condition to the specific product_condition type
        query = query.eq('condition', condition as 'new' | 'like-new' | 'good' | 'fair' | 'poor');
      }

      if (min_price !== undefined) {
        query = query.gte('price', min_price);
      }

      if (max_price !== undefined) {
        query = query.lte('price', max_price);
      }

      // Apply search if provided
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      return {
        products: data || [],
        totalCount: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    },

    // Get user's own listings
    getUserListings: async (userId: string) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }
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
