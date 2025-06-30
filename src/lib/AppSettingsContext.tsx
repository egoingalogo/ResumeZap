import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadAppSettings, getLifetimePlanPrice } from './appSettings';

interface AppSettingsContextType {
  lifetimePlanPrice: string;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

// Create context with default values
const AppSettingsContext = createContext<AppSettingsContextType>({
  lifetimePlanPrice: '79.99',
  isLoading: false,
  error: null,
  refreshSettings: async () => {},
});

// Custom hook to use the app settings context
export const useAppSettings = () => useContext(AppSettingsContext);

interface AppSettingsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for app settings
 * Loads settings on mount and provides them to the application
 */
export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [lifetimePlanPrice, setLifetimePlanPrice] = useState<string>('79.99');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all application settings from the database
   */
  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const price = await getLifetimePlanPrice();
      setLifetimePlanPrice(price);
      console.log('AppSettingsProvider: Settings loaded successfully');
    } catch (error) {
      console.error('AppSettingsProvider: Failed to load settings:', error);
      setError('Failed to load application settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const value: AppSettingsContextType = {
    lifetimePlanPrice,
    isLoading,
    error,
    refreshSettings: loadSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};