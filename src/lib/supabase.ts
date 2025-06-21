import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Supabase configuration with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client instance with TypeScript support
 * Configured for authentication and database operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'resume-analyzer-app',
    },
  },
});

/**
 * Enhanced error handler for Supabase operations
 * Provides user-friendly error messages and debugging information
 */
export const handleSupabaseError = (error: any, operation: string): string => {
  console.error(`Supabase ${operation} error:`, error);
  
  // Handle specific error types
  if (error?.code === 'PGRST116') {
    return 'No data found for this request';
  }
  
  if (error?.code === 'PGRST301') {
    return 'You do not have permission to perform this action';
  }
  
  if (error?.code === '23505') {
    return 'This record already exists';
  }
  
  if (error?.code === '23503') {
    return 'Cannot delete this record as it is referenced by other data';
  }
  
  if (error?.message?.includes('JWT')) {
    return 'Your session has expired. Please log in again';
  }
  
  if (error?.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the database. Please check your internet connection and try again';
  }
  
  if (error?.message?.includes('row-level security')) {
    return 'Access denied. You can only access your own data';
  }
  
  // Return the original error message if no specific handling applies
  return error?.message || `Failed to ${operation}`;
};

/**
 * Test Supabase connection and authentication
 * Useful for debugging connection issues
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

/**
 * Get current user session with error handling
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Failed to get current user:', error);
      throw new Error(handleSupabaseError(error, 'get current user'));
    }
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Sign up a new user with email and password
 * Creates both auth user and user profile
 */
export const signUp = async (email: string, password: string, name: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'sign up'));
    }

    return { user: data.user };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in user with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'sign in'));
    }

    return { user: data.user };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Get the count of users with lifetime plan
 * Used to determine if lifetime plan upgrades should be available
 */
export const getLifetimeUserCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'lifetime');

    if (error) {
      console.error('Failed to get lifetime user count:', error);
      throw new Error(handleSupabaseError(error, 'get lifetime user count'));
    }

    return count || 0;
  } catch (error) {
    console.error('Get lifetime user count error:', error);
    throw error;
  }
};