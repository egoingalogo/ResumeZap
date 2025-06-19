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
 * Sign in an existing user with strict error handling
 * Completely prevents session creation for invalid credentials
 */
export const signIn = async (email: string, password: string) => {
  console.log('Supabase: Attempting sign in for:', email);
  
  // First, ensure we start with a completely clean state
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (cleanupError) {
    console.log('Supabase: Initial cleanup error (expected):', cleanupError);
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Supabase: Sign in failed:', error);
    
    // For ANY error, ensure no session exists
    console.log('Supabase: Ensuring no session exists after failed login');
    
    try {
      // Force sign out to clear any potential session artifacts
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any auth tokens from storage immediately
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
          localStorage.removeItem(key);
          console.log('Supabase: Removed auth token:', key);
        }
      });
      
      // Also clear from sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
          sessionStorage.removeItem(key);
          console.log('Supabase: Removed session auth token:', key);
        }
      });
      
    } catch (storageError) {
      console.error('Supabase: Failed to clear storage after failed login:', storageError);
    }
    
    // Throw the original error to be handled by the auth store
    throw new Error(handleSupabaseError(error, 'sign in'));
  }
  
  // Verify that we actually have a valid session and user
  if (!data.session || !data.user) {
    console.error('Supabase: Sign in succeeded but no session/user returned');
    
    // Clean up any potential artifacts
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (cleanupError) {
      console.error('Supabase: Cleanup error after invalid session:', cleanupError);
    }
    
    throw new Error('Authentication failed - no session created');
  }
  
  // Additional verification: check that the session is actually valid
  try {
    const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionCheck.session || sessionCheck.session.user.id !== data.user.id) {
      console.error('Supabase: Session verification failed');
      await supabase.auth.signOut({ scope: 'global' });
      throw new Error('Session verification failed');
    }
  } catch (verificationError) {
    console.error('Supabase: Session verification error:', verificationError);
    await supabase.auth.signOut({ scope: 'global' });
    throw new Error('Session verification failed');
  }
  
  console.log('Supabase: Sign in successful and verified for user:', data.user.id);
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