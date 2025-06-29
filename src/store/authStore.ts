import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, signUp, signIn, getCurrentUser, handleSupabaseError, getLifetimeUserCount, updateEmail, updateUserName } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium' | 'pro' | 'lifetime';
  profilePictureUrl?: string | null;
  usageThisMonth: {
    resumeTailoring: number;
    coverLetters: number;
    skillGapAnalysis: number;
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  lifetimeUserCount: number | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; needsVerification: boolean }>;
  logout: () => Promise<void>;
  updateUsage: (type: 'resumeTailoring' | 'coverLetters' | 'skillGapAnalysis') => Promise<void>;
  upgradePlan: (plan: 'premium' | 'pro' | 'lifetime') => Promise<void>;
  updateProfilePicture: (profilePictureUrl: string | null) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchLifetimeUserCount: () => Promise<void>;
}

/**
 * Clear all authentication-related data from localStorage and sessionStorage
 */
const clearAllAuthStorage = () => {
  try {
    console.log('AuthStore: Starting complete storage cleanup');
    
    // Clear localStorage
    const localStorageKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key === 'resumezap-auth' ||
        key === 'resumezap-theme'
      )) {
        localStorageKeysToRemove.push(key);
      }
    }
    
    localStorageKeysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('AuthStore: Removed localStorage key:', key);
    });
    
    // Clear sessionStorage
    const sessionStorageKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase')
      )) {
        sessionStorageKeysToRemove.push(key);
      }
    }
    
    sessionStorageKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('AuthStore: Removed sessionStorage key:', key);
    });
    
    // Force clear specific known keys from both storages
    const specificKeys = [
      'resumezap-auth',
      'sb-xbonmxraxoziwtjezreb-auth-token',
      'sb-xbonmxraxoziwtjezreb-auth-token-code-verifier'
    ];
    
    specificKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear all cookies related to Supabase
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('AuthStore: Complete storage cleanup completed');
  } catch (error) {
    console.error('AuthStore: Failed to clear storage:', error);
  }
};

/**
 * Authentication store with real Supabase integration
 * Handles user authentication, profile management, usage tracking, and lifetime quota monitoring
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      lifetimeUserCount: null,
      
      /**
       * Initialize authentication state on app startup
       * Also fetches the current lifetime user count
       */
      initializeAuth: async () => {
        console.log('AuthStore: Initializing authentication');
        set({ isLoading: true });
        
        try {
          // Fetch lifetime user count first (doesn't require authentication)
          await get().fetchLifetimeUserCount();
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            await get().refreshUser();
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('AuthStore: Failed to initialize auth:', error);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Fetch the current count of lifetime plan users
       * Used to determine if upgrade to lifetime should be available
       */
      fetchLifetimeUserCount: async () => {
        try {
          console.log('AuthStore: Fetching lifetime user count');
          const count = await getLifetimeUserCount();
          set({ lifetimeUserCount: count });
          console.log('AuthStore: Lifetime user count updated:', count);
        } catch (error) {
          console.error('AuthStore: Failed to fetch lifetime user count:', error);
          // Set to null to indicate we couldn't fetch the count
          set({ lifetimeUserCount: null });
        }
      },
      
      /**
       * Refresh user data from database
       * Handles cases where user profile might not exist yet (race conditions during registration)
       */
      refreshUser: async () => {
        try {
          const supabaseUser = await getCurrentUser();
          if (!supabaseUser) {
            set({ user: null, isAuthenticated: false });
            return;
          }
          
          // Get user profile from database with better error handling
          const { data: userProfiles, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id);
          
          if (error) {
            console.error('AuthStore: Failed to fetch user profile:', error);
            // Don't immediately fail - might be a temporary network issue
            throw error;
          }
          
          // Check if profile exists
          if (!userProfiles || userProfiles.length === 0) {
            console.warn('AuthStore: User profile not found, attempting to create profile');
            
            // Try to create the missing profile
            const userProfileData = {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'User',
              plan: 'free' as const,
              profile_picture_url: null,
              usage_this_month: {
                resumeTailoring: 0,
                coverLetters: 0,
                skillGapAnalysis: 0,
                skillGapAnalysis: 0,
              },
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('users')
              .upsert(userProfileData, { onConflict: 'id' })
              .select()
              .single();
            
            if (createError) {
              console.error('AuthStore: Failed to create user profile:', createError);
              throw createError;
            }
            
            if (createdProfile) {
              const user: User = {
                id: createdProfile.id,
                email: createdProfile.email,
                name: createdProfile.name,
                plan: createdProfile.plan,
                profilePictureUrl: createdProfile.profile_picture_url,
                usageThisMonth: {
                  resumeTailoring: createdProfile.usage_this_month?.resumeTailoring || 0,
                  coverLetters: createdProfile.usage_this_month?.coverLetters || 0,
                  skillGapAnalysis: createdProfile.usage_this_month?.skillGapAnalysis || 0,
                },
                createdAt: createdProfile.created_at,
              };
              
              set({ user, isAuthenticated: true });
              return;
            }
          }
          
          // Handle multiple profiles (shouldn't happen but be defensive)
          if (userProfiles.length > 1) {
            console.warn('AuthStore: Multiple user profiles found, using the first one');
          }
          
          const userProfile = userProfiles[0];
          
          const user: User = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            plan: userProfile.plan,
            profilePictureUrl: userProfile.profile_picture_url,
            usageThisMonth: {
              resumeTailoring: userProfile.usage_this_month?.resumeTailoring || 0,
              coverLetters: userProfile.usage_this_month?.coverLetters || 0,
              skillGapAnalysis: userProfile.usage_this_month?.skillGapAnalysis || 0,
            },
            createdAt: userProfile.created_at,
          };
          
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('AuthStore: Failed to refresh user:', error);
          
          // Only clear auth state for certain types of errors
          const errorMessage = error instanceof Error ? error.message : '';
          if (errorMessage.includes('JWT') || errorMessage.includes('session') || errorMessage.includes('unauthorized')) {
            console.log('AuthStore: Auth-related error, clearing session');
            set({ user: null, isAuthenticated: false });
          } else {
            console.log('AuthStore: Non-auth error, keeping current state');
            // Don't clear the auth state for network/database errors
          }
        }
      },
      
      /**
       * Login with email and password with enhanced error handling
       * Ensures no session artifacts remain after failed login attempts
       */
      login: async (email: string, password: string) => {
        console.log('AuthStore: Attempting login for:', email);
        set({ isLoading: true });
        
        try {
          // Step 1: Clear any existing session before attempting login
          console.log('AuthStore: Clearing any existing session before login attempt');
          await supabase.auth.signOut({ scope: 'global' });
          clearAllAuthStorage();
          
          // Step 2: Wait a moment to ensure cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Step 3: Attempt login
          console.log('AuthStore: Attempting Supabase sign in');
          const { user: supabaseUser } = await signIn(email, password);
          
          if (!supabaseUser) {
            console.error('AuthStore: Sign in returned no user');
            return false;
          }
          
          // Step 4: Verify the session was actually created and is valid
          console.log('AuthStore: Verifying session after login');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthStore: Session verification failed:', sessionError);
            await supabase.auth.signOut({ scope: 'global' });
            clearAllAuthStorage();
            return false;
          }
          
          if (!session || !session.user || session.user.id !== supabaseUser.id) {
            console.error('AuthStore: Invalid session after login');
            await supabase.auth.signOut({ scope: 'global' });
            clearAllAuthStorage();
            return false;
          }
          
          // Step 5: Refresh user profile from database with retry logic for race conditions
          console.log('AuthStore: Refreshing user profile');
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            await get().refreshUser();
            
            const currentState = get();
            if (currentState.user && currentState.isAuthenticated) {
              console.log('AuthStore: Login successful for user:', supabaseUser.id);
              return true;
            }
            
            // If profile not found, wait and retry (handles race condition during registration)
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`AuthStore: Profile not found, retrying (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // If we get here, profile fetch failed after all retries
          console.error('AuthStore: User profile not found after all retries');
          await supabase.auth.signOut({ scope: 'global' });
          clearAllAuthStorage();
          return false;
          
        } catch (error) {
          console.error('AuthStore: Login failed with error:', error);
          
          // Ensure completely clean state after any login failure
          set({ user: null, isAuthenticated: false });
          
          // Force cleanup of any potential session artifacts
          try {
            console.log('AuthStore: Performing cleanup after login failure');
            await supabase.auth.signOut({ scope: 'global' });
            clearAllAuthStorage();
            
            // Additional cleanup - wait and clear again to be absolutely sure
            await new Promise(resolve => setTimeout(resolve, 100));
            clearAllAuthStorage();
          } catch (cleanupError) {
            console.error('AuthStore: Failed to cleanup after login error:', cleanupError);
          }
          
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Register new user with email verification
       * Returns success status and whether email verification is needed
       */
      register: async (email: string, password: string, name: string) => {
        console.log('AuthStore: Attempting registration for:', email);
        set({ isLoading: true });
        
        try {
          const { user: supabaseUser, session } = await signUp(email, password, name);
          
          if (supabaseUser) {
            // Check if email verification is required
            if (!session) {
              // Email verification required - user will receive verification email
              console.log('AuthStore: Registration successful, email verification required');
              return { success: true, needsVerification: true };
            } else {
              // User is immediately signed in (email confirmation disabled)
              // Create user profile in database using upsert to handle duplicates
              const userProfileData = {
                id: supabaseUser.id,
                email: supabaseUser.email!,
                name,
                plan: 'free' as const,
                profile_picture_url: null,
                usage_this_month: {
                  resumeTailoring: 0,
                  coverLetters: 0,
                  skillGapAnalysis: 0,
                },
              };
              
              const { data: upsertedProfile, error: profileError } = await supabase
                .from('users')
                .upsert(userProfileData, { onConflict: 'id' })
                .select()
                .single();
              
              if (profileError) {
                console.error('AuthStore: Failed to create user profile:', profileError);
                return { success: false, needsVerification: false };
              }
              
              // Use the upserted profile data directly to avoid race condition
              const user: User = {
                id: upsertedProfile.id,
                email: upsertedProfile.email,
                name: upsertedProfile.name,
                plan: upsertedProfile.plan,
                profilePictureUrl: upsertedProfile.profile_picture_url,
                usageThisMonth: {
                  resumeTailoring: upsertedProfile.usage_this_month?.resumeTailoring || 0,
                  coverLetters: upsertedProfile.usage_this_month?.coverLetters || 0,
                  skillGapAnalysis: upsertedProfile.usage_this_month?.skillGapAnalysis || 0,
                },
                createdAt: upsertedProfile.created_at,
              };
              
              set({ user, isAuthenticated: true });
              console.log('AuthStore: Registration and login successful');
              return { success: true, needsVerification: false };
            }
          }
          
          return { success: false, needsVerification: false };
        } catch (error) {
          console.error('AuthStore: Registration failed:', error);
          // Re-throw the error to allow the calling component to handle it specifically
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Logout current user with complete session cleanup and full page refresh
       * The loading overlay will persist until the page refreshes
       */
      logout: async () => {
        console.log('AuthStore: Starting logout process');
        
        // Set logout state to freeze UI - this will persist until page refresh
        set({ isLoggingOut: true });
        
        try {
          // Step 1: Sign out from Supabase
          console.log('AuthStore: Signing out from Supabase...');
          const { error } = await supabase.auth.signOut({ scope: 'global' });
          if (error) {
            console.error('AuthStore: Supabase logout error:', error);
          } else {
            console.log('AuthStore: Supabase logout successful');
          }
          
          // Step 2: Wait a moment to ensure Supabase cleanup is complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error('AuthStore: Supabase logout failed:', error);
        }
        
        // Step 3: Clear all local storage and session data
        console.log('AuthStore: Clearing all local storage...');
        clearAllAuthStorage();
        
        // Step 4: Clear the Zustand persist storage specifically
        try {
          localStorage.removeItem('resumezap-auth');
          localStorage.removeItem('resumezap-theme');
        } catch (error) {
          console.error('AuthStore: Failed to clear Zustand storage:', error);
        }
        
        console.log('AuthStore: All cleanup completed, performing full page refresh...');
        
        // Step 5: Perform full page refresh to landing page
        // Note: We don't clear isLoggingOut here - it will persist until the page refreshes
        // This ensures the loading overlay stays visible throughout the entire process
        setTimeout(() => {
          window.location.href = '/';
        }, 800); // Slightly longer delay to ensure all cleanup is complete
      },
      
      /**
       * Update usage count for current user
       */
      updateUsage: async (type: 'resumeTailoring' | 'coverLetters' | 'skillGapAnalysis') => {
        const { user } = get();
        if (!user) return;
        
        console.log(`AuthStore: Updating ${type} usage count`);
        
        try {
          const newUsage = {
            ...user.usageThisMonth,
            [type]: user.usageThisMonth[type] + 1,
          };
          
          const { error } = await supabase
            .from('users')
            .update({ usage_this_month: newUsage })
            .eq('id', user.id);
          
          if (error) {
            console.error('AuthStore: Failed to update usage:', error);
            return;
          }
          
          // Update local state
          set({
            user: {
              ...user,
              usageThisMonth: newUsage,
            },
          });
        } catch (error) {
          console.error('AuthStore: Failed to update usage:', error);
        }
      },
      
      /**
       * Upgrade user plan and refresh lifetime user count
       */
      upgradePlan: async (plan: 'premium' | 'pro' | 'lifetime') => {
        const { user } = get();
        if (!user) return;
        
        console.log(`AuthStore: Upgrading user plan to ${plan}`);
        
        try {
          const { error } = await supabase
            .from('users')
            .update({ plan })
            .eq('id', user.id);
          
          if (error) {
            console.error('AuthStore: Failed to upgrade plan:', error);
            return;
          }
          
          // Update local state
          set({
            user: {
              ...user,
              plan,
            },
          });
          
          // If upgrading to lifetime, refresh the lifetime user count
          if (plan === 'lifetime') {
            await get().fetchLifetimeUserCount();
          }
        } catch (error) {
          console.error('AuthStore: Failed to upgrade plan:', error);
        }
      },
      
      /**
       * Update user profile picture URL
       */
      updateProfilePicture: async (profilePictureUrl: string | null) => {
        const { user } = get();
        if (!user) return;
        
        console.log('AuthStore: Updating profile picture URL');
        
        try {
          const { error } = await supabase
            .from('users')
            .update({ 
              profile_picture_url: profilePictureUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
          
          if (error) {
            console.error('AuthStore: Failed to update profile picture:', error);
            return;
          }
          
          // Update local state
          set({
            user: {
              ...user,
              profilePictureUrl,
            },
          });
        } catch (error) {
          console.error('AuthStore: Failed to update profile picture:', error);
        }
      },

      /**
       * Update user name with validation and state refresh
       */
      updateUserName: async (newName: string) => {
        const { user } = get();
        if (!user) {
          throw new Error('No authenticated user found');
        }
        
        console.log('AuthStore: Updating user name');
        
        try {
          await updateUserName(newName);
          
          // Update local state immediately
          set({
            user: {
              ...user,
              name: newName.trim(),
            },
          });
          
          console.log('AuthStore: User name updated successfully');
        } catch (error) {
          console.error('AuthStore: Failed to update user name:', error);
          throw error;
        }
      },

      /**
       * Update user email address with verification
       */
      updateUserEmail: async (newEmail: string) => {
        const { user } = get();
        if (!user) return;
        
        console.log('AuthStore: Updating user email address');
        
        try {
          await updateEmail(newEmail);
          
          // Note: Email won't be updated in the database until the user verifies the new email
          // The user will receive a verification email at the new address
          console.log('AuthStore: Email update verification sent');
        } catch (error) {
          console.error('AuthStore: Failed to update email:', error);
          throw error;
        }
      },
    }),
    {
      name: 'resumezap-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        lifetimeUserCount: state.lifetimeUserCount
      }),
      // Clear persisted state on logout
      onRehydrateStorage: () => (state) => {
        if (state && !state.isAuthenticated) {
          state.user = null;
        }
      },
    }
  )
);

// Set up auth state listener with improved error handling and race condition prevention
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('AuthStore: Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session?.user) {
    // Handle email verification completion
    if (session.user.email_confirmed_at && !session.user.user_metadata?.profile_created) {
      // User just verified their email, create profile using upsert to handle duplicates
      const userProfileData = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || 'User',
        plan: 'free' as const,
        profile_picture_url: null,
        usage_this_month: {
          resumeTailoring: 0,
          coverLetters: 0,
        },
      };
      
      try {
        await supabase
          .from('users')
          .upsert(userProfileData, { onConflict: 'id' });
        
        // Mark profile as created
        await supabase.auth.updateUser({
          data: { profile_created: true }
        });
      } catch (error) {
        console.error('AuthStore: Failed to create profile after email verification:', error);
      }
    }
    
    // Prevent race condition during registration by checking if user is already set
    const currentState = useAuthStore.getState();
    
    // Only refresh user if:
    // 1. No user is currently set in the store, OR
    // 2. The session user ID doesn't match the current store user ID
    if (!currentState.user || currentState.user.id !== session.user.id) {
      await useAuthStore.getState().refreshUser();
    }
  } else if (event === 'SIGNED_OUT') {
    // Only clear state if we're not in the middle of a logout process
    // This prevents the double state change that causes the glitch
    const currentState = useAuthStore.getState();
    if (currentState.isAuthenticated && !currentState.isLoggingOut) {
      useAuthStore.setState({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  }
});