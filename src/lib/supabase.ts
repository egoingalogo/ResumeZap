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
  
  // Handle network/fetch errors first
  if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
    console.error('Network error details:', {
      message: error.message,
      name: error.name,
      supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });
    return 'Unable to connect to Supabase. Please check your environment configuration and internet connection.';
  }
  
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
    console.log('Supabase Anon Key:', supabaseAnonKey ? `Present (${supabaseAnonKey.substring(0, 20)}...)` : 'Missing');
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.error('Invalid Supabase URL format:', supabaseUrl);
      return false;
    }
    
    // Validate anon key format (should be a JWT)
    if (!supabaseAnonKey.startsWith('eyJ')) {
      console.error('Invalid Supabase anon key format');
      return false;
    }
    
    // Test basic connection with a simple query
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      // Provide more specific error information
      if (error.message?.includes('Failed to fetch')) {
        console.error('Network connectivity issue - check internet connection and Supabase URL');
      } else if (error.message?.includes('Invalid API key')) {
        console.error('Authentication issue - check Supabase anon key');
      }
      
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
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
 * Sign up a new user with email verification
 * Creates both auth user and user profile after email confirmation
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
        emailRedirectTo: `${window.location.origin}/auth?verified=true`,
      },
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'sign up'));
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in user with email and password
 * Requires email verification to be completed
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

    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * Uses the configured SMTP settings and custom email template
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'send password reset email'));
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Update user password (used after reset or in settings)
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'update password'));
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

/**
 * Update user email address with verification
 * Sends confirmation email to new address
 */
export const updateEmail = async (newEmail: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    }, {
      emailRedirectTo: `${window.location.origin}/settings?email-updated=true`
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'update email'));
    }

    return { success: true };
  } catch (error) {
    console.error('Update email error:', error);
    throw error;
  }
};

/**
 * Resend email verification
 * For users who didn't receive the initial verification email
 */
export const resendVerification = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?verified=true`,
      }
    });

    if (error) {
      throw new Error(handleSupabaseError(error, 'resend verification email'));
    }

    return { success: true };
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
};

/**
 * Delete user account completely using Supabase Edge Function
 * This function calls the delete-user edge function which handles complete account deletion
 * including auth.users record and all related data via CASCADE constraints
 */
export const deleteUserAccount = async (): Promise<void> => {
  try {
    console.log('deleteUserAccount: Starting account deletion process');
    
    // Get current session to ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('deleteUserAccount: Failed to get session:', sessionError);
      throw new Error('No valid session found. Please sign in again.');
    }
    
    if (!session?.access_token) {
      console.error('deleteUserAccount: No access token in session');
      throw new Error('No valid session found. Please sign in again.');
    }
    
    console.log('deleteUserAccount: Session validated, calling edge function');
    
    // Call the delete-user edge function
    const { data, error } = await supabase.functions.invoke('delete-user', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    if (error) {
      console.error('deleteUserAccount: Edge function error:', error);
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (data?.error) {
      console.error('deleteUserAccount: Edge function returned error:', data.error);
      throw new Error(data.error);
    }
    
    console.log('deleteUserAccount: Account deletion completed successfully');
    
  } catch (error) {
    console.error('deleteUserAccount: Account deletion failed:', error);
    
    // Re-throw the error to be handled by the calling component
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred during account deletion');
    }
  }
};

/**
 * Get the count of users with lifetime plan using Edge Function
 * Uses Edge Function to bypass RLS and get accurate global count
 */
export const getLifetimeUserCount = async (): Promise<number> => {
  try {
    console.log('getLifetimeUserCount: Calling Edge Function for accurate count');
    
    // Call the get-lifetime-user-count edge function
    const { data, error } = await supabase.functions.invoke('get-lifetime-user-count');
    
    if (error) {
      console.error('getLifetimeUserCount: Edge function error:', error);
      throw new Error(`Failed to get lifetime user count: ${error.message}`);
    }
    
    if (data?.error) {
      console.error('getLifetimeUserCount: Edge function returned error:', data.error);
      throw new Error(data.error);
    }
    
    if (!data?.success || typeof data.count !== 'number') {
      console.error('getLifetimeUserCount: Invalid response format:', data);
      throw new Error('Invalid response from lifetime user count service');
    }
    
    console.log('getLifetimeUserCount: Successfully fetched count:', data.count);
    return data.count;
    
  } catch (error) {
    console.error('getLifetimeUserCount: Failed to get lifetime user count:', error);
    
    // Fallback: try direct database query (will be limited by RLS but better than nothing)
    console.log('getLifetimeUserCount: Attempting fallback direct query');
    try {
      const { count, error: fallbackError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'lifetime');

      if (fallbackError) {
        console.error('getLifetimeUserCount: Fallback query also failed:', fallbackError);
        throw new Error(handleSupabaseError(fallbackError, 'get lifetime user count'));
      }

      console.log('getLifetimeUserCount: Fallback query returned count:', count || 0);
      return count || 0;
    } catch (fallbackError) {
      console.error('getLifetimeUserCount: Both Edge Function and fallback failed');
      throw error; // Re-throw the original error
    }
  }
};