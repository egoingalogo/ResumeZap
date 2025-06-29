import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Supabase configuration with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
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
          full_name: name, // This populates the "Display name" in Supabase dashboard
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
        // Don't throw error here - let the app continue
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
 * Update user name in the database
 * Updates the name field in the users table for the current authenticated user
 */
export const updateUserName = async (newName: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    // Validate the new name
    if (!newName?.trim()) {
      throw new Error('Name cannot be empty');
    }

    const trimmedName = newName.trim();

    // Validate name format (letters and spaces only, at least 3 characters per name part)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(trimmedName)) {
      throw new Error('Name can only contain letters and spaces');
    }

    const nameParts = trimmedName.split(/\s+/);
    if (nameParts.length < 2 || nameParts.some(part => part.length < 3)) {
      throw new Error('Please enter your full name (at least 3 characters per name)');
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(handleSupabaseError(error, 'update user name'));
    }

    return { success: true };
  } catch (error) {
    console.error('Update user name error:', error);
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
      try {
        await useAuthStore.getState().refreshUser();
      } catch (error) {
        console.error('AuthStore: Failed to refresh user in auth state change:', error);
        // Don't crash the app - the user might still be able to use it
      }
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
 * Get the count of users with lifetime plan
 * Uses graceful fallback to direct database query when Edge Function is unavailable
 */
export const getLifetimeUserCount = async (): Promise<number> => {
  try {
    // Check basic Supabase connectivity first to prevent fetch errors
    console.log('getLifetimeUserCount: Testing Supabase connection before Edge Function call');
    const isConnected = await testSupabaseConnection();
    
    if (!isConnected) {
      console.warn('getLifetimeUserCount: Basic connectivity test failed, using fallback immediately');
      return await getLifetimeUserCountFallback();
    }
    
    // Validate supabaseUrl before attempting fetch
    if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.warn('getLifetimeUserCount: Invalid or missing VITE_SUPABASE_URL, using fallback. URL:', supabaseUrl);
      return await getLifetimeUserCountFallback();
    }
    
    console.log('getLifetimeUserCount: Attempting to call Edge Function');
    
    // Try calling the Edge Function with proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/get-lifetime-user-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn('getLifetimeUserCount: Fetch failed, using fallback:', fetchError);
      return await getLifetimeUserCountFallback();
    }
    
    if (!response.ok) {
      console.warn(`getLifetimeUserCount: Edge function returned ${response.status}, using fallback`);
      return await getLifetimeUserCountFallback();
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn('getLifetimeUserCount: Failed to parse Edge function response, using fallback:', jsonError);
      return await getLifetimeUserCountFallback();
    }
    
    if (data?.error) {
      console.warn('getLifetimeUserCount: Edge function returned error, using fallback:', data.error);
      return await getLifetimeUserCountFallback();
    }
    
    if (!data?.success || typeof data.count !== 'number') {
      console.warn('getLifetimeUserCount: Invalid Edge function response, using fallback:', data);
      return await getLifetimeUserCountFallback();
    }
    
    console.log('getLifetimeUserCount: Edge Function successful, count:', data.count);
    return data.count;
    
  } catch (error) {
    console.warn('getLifetimeUserCount: Edge Function call failed, using fallback:', error);
    return await getLifetimeUserCountFallback();
  }
};

/**
 * Fallback method to get lifetime user count using direct database query
 * This will be limited by RLS but provides a working alternative
 */
const getLifetimeUserCountFallback = async (): Promise<number> => {
  try {
    console.log('getLifetimeUserCountFallback: Using direct database query');
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'lifetime');

    if (error) {
      console.error('getLifetimeUserCountFallback: Database query failed:', error);
      
      // Return 0 as a safe fallback instead of throwing an error
      console.log('getLifetimeUserCountFallback: Returning 0 as safe fallback');
      return 0;
    }

    const fallbackCount = count || 0;
    console.log('getLifetimeUserCountFallback: Fallback query successful, count:', fallbackCount);
    return fallbackCount;
    
  } catch (error) {
    console.error('getLifetimeUserCountFallback: Fallback query failed:', error);
    
    // Return 0 as the ultimate fallback
    console.log('getLifetimeUserCountFallback: Returning 0 as ultimate fallback');
    return 0;
  }
};