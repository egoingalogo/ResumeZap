import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
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
  checkSession: () => Promise<void>;
}

/**
 * Authentication store managing user state with Supabase integration
 * Handles login, registration, logout, and subscription management
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      /**
       * Authenticate user with email and password using Supabase Auth
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
            console.error('AuthStore: Login error:', error.message);
            set({ isLoading: false });
            return false;
          }

          if (data.user) {
            // Fetch user profile from users table
            const userProfile = await fetchUserProfile(data.user.id);
            if (userProfile) {
              set({ 
                user: userProfile, 
                isAuthenticated: true, 
                isLoading: false 
              });
              console.log('AuthStore: Login successful');
              return true;
            }
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('AuthStore: Login failed:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      /**
       * Register new user with email, password, and name using Supabase Auth
       */
      register: async (email: string, password: string, name: string) => {
        console.log('AuthStore: Attempting registration for:', email);
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name,
              }
            }
          });

          if (error) {
            console.error('AuthStore: Registration error:', error.message);
            set({ isLoading: false });
            return false;
          }

          if (data.user) {
            // Create user profile in users table
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name: name,
                plan: 'free',
                usage_this_month: {
                  cover_letters: 0,
                  resume_tailoring: 0,
                },
              });

            if (profileError) {
              console.error('AuthStore: Profile creation error:', profileError.message);
              set({ isLoading: false });
              return false;
            }

            // If email confirmation is disabled, user will be automatically signed in
            if (data.session) {
              const userProfile = await fetchUserProfile(data.user.id);
              if (userProfile) {
                set({ 
                  user: userProfile, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
                console.log('AuthStore: Registration successful');
                return true;
              }
            } else {
              // Email confirmation required
              console.log('AuthStore: Registration successful, email confirmation required');
              set({ isLoading: false });
              return true;
            }
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('AuthStore: Registration failed:', error);
          set({ isLoading: false });
          return false;
        }
      },
      
      /**
       * Sign out user using Supabase Auth
       */
      logout: async () => {
        console.log('AuthStore: Logging out user');
        set({ isLoading: true });
        
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('AuthStore: Logout error:', error.message);
          }
        } catch (error) {
          console.error('AuthStore: Logout failed:', error);
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      
      /**
       * Update user usage count in database
       */
      updateUsage: async (type: 'resumeTailoring' | 'coverLetters') => {
        const { user } = get();
        if (!user) return;

        console.log(`AuthStore: Updating ${type} usage count`);
        
        try {
          const fieldName = type === 'resumeTailoring' ? 'resume_tailoring' : 'cover_letters';
          const newUsage = {
            ...user.usageThisMonth,
            [type]: user.usageThisMonth[type] + 1,
          };

          const { error } = await supabase
            .from('users')
            .update({
              usage_this_month: {
                cover_letters: newUsage.coverLetters,
                resume_tailoring: newUsage.resumeTailoring,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (error) {
            console.error('AuthStore: Usage update error:', error.message);
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
          console.error('AuthStore: Usage update failed:', error);
        }
      },
      
      /**
       * Upgrade user plan in database
       */
      upgradePlan: async (plan: 'premium' | 'pro' | 'lifetime') => {
        const { user } = get();
        if (!user) return;

        console.log(`AuthStore: Upgrading user plan to ${plan}`);
        
        try {
          const { error } = await supabase
            .from('users')
            .update({
              plan,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          if (error) {
            console.error('AuthStore: Plan upgrade error:', error.message);
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
          console.error('AuthStore: Plan upgrade failed:', error);
        }
      },

      /**
       * Check for existing session on app load
       */
      checkSession: async () => {
        console.log('AuthStore: Checking existing session');
        set({ isLoading: true });
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('AuthStore: Session check error:', error.message);
            set({ isLoading: false });
            return;
          }

          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile) {
              set({ 
                user: userProfile, 
                isAuthenticated: true, 
                isLoading: false 
              });
              console.log('AuthStore: Session restored');
              return;
            }
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('AuthStore: Session check failed:', error);
          set({ isLoading: false });
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

/**
 * Fetch user profile data from the users table
 */
async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('AuthStore: Profile fetch error:', error.message);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        plan: data.plan,
        usageThisMonth: {
          resumeTailoring: data.usage_this_month.resume_tailoring,
          coverLetters: data.usage_this_month.cover_letters,
        },
        createdAt: data.created_at,
      };
    }

    return null;
  } catch (error) {
    console.error('AuthStore: Profile fetch failed:', error);
    return null;
  }
}

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('AuthStore: Auth state changed:', event);
  
  if (event === 'SIGNED_OUT' || !session) {
    useAuthStore.getState().logout();
  } else if (event === 'SIGNED_IN' && session?.user) {
    // Handle sign in - fetch user profile
    fetchUserProfile(session.user.id).then((userProfile) => {
      if (userProfile) {
        useAuthStore.setState({ 
          user: userProfile, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
    });
  }
});