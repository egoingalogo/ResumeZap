import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, signUp, signIn, signOut, getCurrentUser, handleSupabaseError } from '../lib/supabase';
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
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUsage: (type: 'resumeTailoring' | 'coverLetters') => Promise<void>;
  upgradePlan: (plan: 'premium' | 'pro' | 'lifetime') => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

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
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: supabaseUser.id,
                email: supabaseUser.email!,
                name,
                plan: 'free',
                usage_this_month: {
                  resumeTailoring: 0,
                  coverLetters: 0,
                },
              });
            
            if (profileError) {
              console.error('AuthStore: Failed to create user profile:', profileError);
              return false;
            }
            
            await get().refreshUser();
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
       * Logout current user
       */
      logout: async () => {
        console.log('AuthStore: Logging out user');
        set({ isLoading: true });
        
        try {
          await signOut();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('AuthStore: Logout failed:', error);
        } finally {
          set({ isLoading: false });
        }
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
    }
  )
);

// Set up auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('AuthStore: Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session?.user) {
    await useAuthStore.getState().refreshUser();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }
});