import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, signUp, signIn, getCurrentUser, handleSupabaseError } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium' | 'pro' | 'lifetime';
  usageThisMonth: {
    resumeTailoring: number;
    coverLetters: number;
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUsage: (type: 'resumeTailoring' | 'coverLetters') => Promise<void>;
  upgradePlan: (plan: 'premium' | 'pro' | 'lifetime') => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
 * Handles user authentication, profile management, and usage tracking
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      
      /**
       * Initialize authentication state on app startup
       */
      initializeAuth: async () => {
        console.log('AuthStore: Initializing authentication');
        set({ isLoading: true });
        
        try {
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
       * Refresh user data from database
       */
      refreshUser: async () => {
        try {
          const supabaseUser = await getCurrentUser();
          if (!supabaseUser) {
            set({ user: null, isAuthenticated: false });
            return;
          }
          
          // Get user profile from database
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();
          
          if (error) {
            console.error('AuthStore: Failed to fetch user profile:', error);
            set({ user: null, isAuthenticated: false });
            return;
          }
          
          const user: User = {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            plan: userProfile.plan,
            usageThisMonth: userProfile.usage_this_month as any,
            createdAt: userProfile.created_at,
          };
          
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('AuthStore: Failed to refresh user:', error);
          set({ user: null, isAuthenticated: false });
        }
      },
      
      /**
       * Login with email and password
       */
      login: async (email: string, password: string) => {
        console.log('AuthStore: Attempting login for:', email);
        set({ isLoading: true });
        
        try {
          const { user: supabaseUser } = await signIn(email, password);
          
          if (supabaseUser) {
            await get().refreshUser();
            console.log('AuthStore: Login successful');
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('AuthStore: Login failed:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Register new user
       */
      register: async (email: string, password: string, name: string) => {
        console.log('AuthStore: Attempting registration for:', email);
        set({ isLoading: true });
        
        try {
          const { user: supabaseUser } = await signUp(email, password, name);
          
          if (supabaseUser) {
            // Create user profile in database
            const userProfileData = {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              name,
              plan: 'free' as const,
              usage_this_month: {
                resumeTailoring: 0,
                coverLetters: 0,
              },
            };
            
            const { data: insertedProfile, error: profileError } = await supabase
              .from('users')
              .insert(userProfileData)
              .select()
              .single();
            
            if (profileError) {
              console.error('AuthStore: Failed to create user profile:', profileError);
              return false;
            }
            
            // Use the inserted profile data directly to avoid race condition
            const user: User = {
              id: insertedProfile.id,
              email: insertedProfile.email,
              name: insertedProfile.name,
              plan: insertedProfile.plan,
              usageThisMonth: insertedProfile.usage_this_month as any,
              createdAt: insertedProfile.created_at,
            };
            
            set({ user, isAuthenticated: true });
            console.log('AuthStore: Registration successful');
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('AuthStore: Registration failed:', error);
          return false;
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
      updateUsage: async (type: 'resumeTailoring' | 'coverLetters') => {
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
       * Upgrade user plan
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
        } catch (error) {
          console.error('AuthStore: Failed to upgrade plan:', error);
        }
      },
    }),
    {
      name: 'resumezap-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
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