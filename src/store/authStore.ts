import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUsage: (type: 'resumeTailoring' | 'coverLetters') => void;
  upgradePlan: (plan: 'premium' | 'pro' | 'lifetime') => void;
}

/**
 * Authentication store managing user state, login/logout, and subscription management
 * Handles usage tracking for freemium model limitations
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        console.log('AuthStore: Attempting login for:', email);
        try {
          // Simulate API call - replace with actual authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock account for testing - use test@example.com with any password
          let mockUser: User;
          
          if (email === 'test@example.com') {
            // Pre-configured test account with usage data
            mockUser = {
              id: 'test-user-123',
              email: 'test@example.com',
              name: 'Test User',
              plan: 'premium',
              usageThisMonth: {
                resumeTailoring: 5,
                coverLetters: 3,
              },
              createdAt: '2024-01-01T00:00:00.000Z',
            };
          } else if (email === 'pro@example.com') {
            // Pro account for testing unlimited features
            mockUser = {
              id: 'pro-user-456',
              email: 'pro@example.com',
              name: 'Pro User',
              plan: 'pro',
              usageThisMonth: {
                resumeTailoring: 25,
                coverLetters: 15,
              },
              createdAt: '2024-01-01T00:00:00.000Z',
            };
          } else if (email === 'lifetime@example.com') {
            // Lifetime account for testing
            mockUser = {
              id: 'lifetime-user-789',
              email: 'lifetime@example.com',
              name: 'Lifetime User',
              plan: 'lifetime',
              usageThisMonth: {
                resumeTailoring: 50,
                coverLetters: 30,
              },
              createdAt: '2023-06-15T00:00:00.000Z',
            };
          } else {
            // Default new user
            mockUser = {
              id: Date.now().toString(),
              email,
              name: email.split('@')[0],
              plan: 'free',
              usageThisMonth: {
                resumeTailoring: 0,
                coverLetters: 0,
              },
              createdAt: new Date().toISOString(),
            };
          }
          
          set({ user: mockUser, isAuthenticated: true });
          console.log('AuthStore: Login successful');
          return true;
        } catch (error) {
          console.error('AuthStore: Login failed:', error);
          return false;
        }
      },
      
      register: async (email: string, password: string, name: string) => {
        console.log('AuthStore: Attempting registration for:', email);
        try {
          // Simulate API call - replace with actual registration
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            plan: 'free',
            usageThisMonth: {
              resumeTailoring: 0,
              coverLetters: 0,
            },
            createdAt: new Date().toISOString(),
          };
          
          set({ user: newUser, isAuthenticated: true });
          console.log('AuthStore: Registration successful');
          return true;
        } catch (error) {
          console.error('AuthStore: Registration failed:', error);
          return false;
        }
      },
      
      logout: () => {
        console.log('AuthStore: Logging out user');
        set({ user: null, isAuthenticated: false });
      },
      
      updateUsage: (type: 'resumeTailoring' | 'coverLetters') => {
        const { user } = get();
        if (user) {
          console.log(`AuthStore: Updating ${type} usage count`);
          set({
            user: {
              ...user,
              usageThisMonth: {
                ...user.usageThisMonth,
                [type]: user.usageThisMonth[type] + 1,
              },
            },
          });
        }
      },
      
      upgradePlan: (plan: 'premium' | 'pro' | 'lifetime') => {
        const { user } = get();
        if (user) {
          console.log(`AuthStore: Upgrading user plan to ${plan}`);
          set({
            user: {
              ...user,
              plan,
            },
          });
        }
      },
    }),
    {
      name: 'resumezap-auth',
    }
  )
);