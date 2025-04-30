
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Configure Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// JWT configuration
const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'your-secret-key';
const tokenExpiration = 60 * 60 * 24; // 24 hours

// Generate JWT key for signing tokens
const getKey = async () => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password: string): boolean => {
  return password.length >= 8; // Basic validation, can be enhanced
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // User Registration
    if (req.method === 'POST' && path === 'register') {
      const { name, email, password } = await req.json();

      // Validate input
      if (!name || !email || !password) {
        return new Response(
          JSON.stringify({ error: 'Name, email, and password are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!isStrongPassword(password)) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters long' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User with this email already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      // Create Supabase auth user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authUser.user) {
        return new Response(
          JSON.stringify({ error: authError?.message || 'Failed to create user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: name })
        .eq('id', authUser.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Generate JWT token
      const key = await getKey();
      const token = await create(
        { alg: "HS256", typ: "JWT" },
        { sub: authUser.user.id, exp: Math.floor(Date.now() / 1000) + tokenExpiration },
        key
      );

      return new Response(
        JSON.stringify({ 
          message: 'User registered successfully', 
          user: { 
            id: authUser.user.id,
            name,
            email
          },
          token 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      );
    }
    
    // User Login
    else if (req.method === 'POST' && path === 'login') {
      const { email, password } = await req.json();

      // Validate input
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Generate JWT token
      const key = await getKey();
      const token = await create(
        { alg: "HS256", typ: "JWT" },
        { sub: authData.user.id, exp: Math.floor(Date.now() / 1000) + tokenExpiration },
        key
      );

      return new Response(
        JSON.stringify({ 
          message: 'Login successful',
          user: { 
            id: authData.user.id,
            email: authData.user.email,
            name: profile?.username || '',
          },
          token
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Get current user
    else if (req.method === 'GET' && path === 'me') {
      // Get and validate JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization token is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];
      try {
        // Verify token
        const key = await getKey();
        const payload = await verify(token, key);
        const userId = payload.sub;

        // Get user data
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url, bio, department, year')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    }
    
    // Route not found
    else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
