import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '../types/database';

type DatabaseUser = Database['public']['Tables']['users']['Row'];

interface User extends Omit<DatabaseUser, 'usage_this_month'> {
  usageThisMonth: {
    resumeTailoring: number;
    coverLetters: number;
  };
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
  updateProfile: (updates: { name?: string; email?: string }) => Promise<boolean>;
}

/**
 * Authentication store with Supabase integration
 * Handles user authentication, profile management, and usage tracking
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      /**
       * Initialize authentication state from Supabase session
       */
      initializeAuth: async () => {
        console.log('AuthStore: Initializing authentication');
        set({ isLoading: true });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch user profile from database
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('AuthStore: Failed to fetch user profile:', error);
              await supabase.auth.signOut();
              set({ user: null, isAuthenticated: false });
            } else if (userProfile) {
              const user: User = {
                ...userProfile,
                usageThisMonth: {
                  resumeTailoring: userProfile.usage_this_month.resume_tailoring,
                  coverLetters: userProfile.usage_this_month.cover_letters,
                },
              };
              set({ user, isAuthenticated: true });
              console.log('AuthStore: User session restored');
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('AuthStore: Auth initialization failed:', error);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      /**
       * Login user with email and password
       */
      login: async (email: string, password: string) => {
        console.log('AuthStore: Attempting login for:', email);
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            console.error('AuthStore: Login failed:', error);
            set({ isLoading: false });
            return false;
          }
          
          if (data.user) {
            // Fetch user profile
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            if (profileError) {
              console.error('AuthStore: Failed to fetch user profile:', profileError);
              set({ isLoading: false });
              return false;
            }
            
            const user: User = {
              ...userProfile,
              usageThisMonth: {
                resumeTailoring: userProfile.usage_this_month.resume_tailoring,
                coverLetters: userProfile.usage_this_month.cover_letters,
              },
            };
            
            set({ user, isAuthenticated: true, isLoading: false });
            console.log('AuthStore: Login successful');
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('AuthStore: Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      /**
       * Register new user with email, password, and name
       */
      register: async (email: string, password: string, name: string) => {
        console.log('AuthStore: Attempting registration for:', email);
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (error) {
            console.error('AuthStore: Registration failed:', error);
            set({ isLoading: false });
            return false;
          }
          
          if (data.user) {
            // Create user profile in database
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email,
                name,
                plan: 'free',
                usage_this_month: {
                  resume_tailoring: 0,
                  cover_letters: 0,
                },
              });
            
            if (profileError) {
              console.error('AuthStore: Failed to create user profile:', profileError);
              set({ isLoading: false });
              return false;
            }
            
            // If email confirmation is disabled, user is immediately available
            if (data.session) {
              const user: User = {
                id: data.user.id,
                email,
                name,
                plan: 'free',
                usageThisMonth: {
                  resumeTailoring: 0,
                  coverLetters: 0,
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              
              set({ user, isAuthenticated: true, isLoading: false });
              console.log('AuthStore: Registration successful');
              return true;
            }
          }
          
          set({ isLoading: false });
          return true; // Registration successful, but email confirmation may be required
        } catch (error) {
          console.error('AuthStore: Registration error:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      /**
       * Logout current user
       */
      logout: async () => {
        console.log('AuthStore: Logging out user');
        set({ isLoading: true });
        
        try {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, isLoading: false });
          console.log('AuthStore: Logout successful');
        } catch (error) {
          console.error('AuthStore: Logout error:', error);
          set({ isLoading: false });
        }
      },
      
      /**
       * Update user usage count for the current month
       */
      updateUsage: async (type: 'resumeTailoring' | 'coverLetters') => {
        const { user } = get();
        if (!user) return;
        
        console.log(`AuthStore: Updating ${type} usage count`);
        
        try {
          const dbField = type === 'resumeTailoring' ? 'resume_tailoring' : 'cover_letters';
          const newCount = user.usageThisMonth[type] + 1;
          
          const { error } = await supabase
            .from('users')
            .update({
              usage_this_month: {
                ...user.usageThisMonth,
                [dbField]: newCount,
              },
            })
            .eq('id', user.id);
          
          if (error) {
            console.error('AuthStore: Failed to update usage:', error);
            return;
          }
          
          set({
            user: {
              ...user,
              usageThisMonth: {
                ...user.usageThisMonth,
                [type]: newCount,
              },
            },
          });
        } catch (error) {
          console.error('AuthStore: Usage update error:', error);
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
          
          set({
            user: {
              ...user,
              plan,
            },
          });
          
          console.log('AuthStore: Plan upgrade successful');
        } catch (error) {
          console.error('AuthStore: Plan upgrade error:', error);
        }
      },
      
      /**
       * Update user profile information
       */
      updateProfile: async (updates: { name?: string; email?: string }) => {
        const { user } = get();
        if (!user) return false;
        
        console.log('AuthStore: Updating user profile');
        set({ isLoading: true });
        
        try {
          // Update auth user if email is being changed
          if (updates.email && updates.email !== user.email) {
            const { error: authError } = await supabase.auth.updateUser({
              email: updates.email,
            });
            
            if (authError) {
              console.error('AuthStore: Failed to update auth email:', authError);
              set({ isLoading: false });
              return false;
            }
          }
          
          // Update user profile in database
          const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);
          
          if (error) {
            console.error('AuthStore: Failed to update profile:', error);
            set({ isLoading: false });
            return false;
          }
          
          set({
            user: {
              ...user,
              ...updates,
            },
            isLoading: false,
          });
          
          console.log('AuthStore: Profile update successful');
          return true;
        } catch (error) {
          console.error('AuthStore: Profile update error:', error);
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'resumezap-auth',
      partialize: (state) => ({
        // Only persist essential data, not sensitive information
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Set up auth state change listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('AuthStore: Auth state changed:', event);
  
  if (event === 'SIGNED_OUT' || !session) {
    useAuthStore.getState().logout();
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Re-initialize auth to fetch latest user data
    await useAuthStore.getState().initializeAuth();
  }
});