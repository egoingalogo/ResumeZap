import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

/**
 * Theme store for managing dark/light mode preferences
 * Persists theme selection to localStorage for user preference retention
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => {
        console.log('ThemeStore: Toggling theme mode');
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
    }),
    {
      name: 'resumezap-theme',
    }
  )
);