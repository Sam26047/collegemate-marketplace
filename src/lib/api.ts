
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
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          seller_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
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
