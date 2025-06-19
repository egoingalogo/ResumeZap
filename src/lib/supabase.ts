import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

/**
 * Supabase client instance configured with TypeScript types
 * Handles authentication, database operations, and real-time subscriptions
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper function to handle Supabase errors consistently
 */
export const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error in ${context}:`, error);
  
  if (error?.message) {
    return error.message;
  }
  
  return `An error occurred in ${context}. Please try again.`;
};

/**
 * Check if user is authenticated
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

/**
 * Sign up a new user
 */
export const signUp = async (email: string, password: string, name: string) => {
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
  
  return data;
};

/**
 * Sign in an existing user with proper error handling
 * Ensures no session is created for invalid credentials
 */
export const signIn = async (email: string, password: string) => {
  console.log('Supabase: Attempting sign in for:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Supabase: Sign in failed:', error);
    
    // Ensure no session exists after failed login
    if (error.message.includes('Invalid login credentials') || 
        error.message.includes('Email not confirmed') ||
        error.message.includes('Invalid email or password')) {
      
      console.log('Supabase: Clearing any existing session after failed login');
      
      // Force sign out to clear any potential session artifacts
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any auth tokens from storage
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') && key.includes('auth-token')) {
            localStorage.removeItem(key);
            console.log('Supabase: Removed auth token:', key);
          }
        });
      } catch (storageError) {
        console.error('Supabase: Failed to clear storage:', storageError);
      }
    }
    
    throw new Error(handleSupabaseError(error, 'sign in'));
  }
  
  // Verify that we actually have a valid session and user
  if (!data.session || !data.user) {
    console.error('Supabase: Sign in succeeded but no session/user returned');
    throw new Error('Authentication failed - no session created');
  }
  
  console.log('Supabase: Sign in successful for user:', data.user.id);
  return data;
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?mode=reset`,
  });
  
  if (error) {
    throw new Error(handleSupabaseError(error, 'password reset'));
  }
};