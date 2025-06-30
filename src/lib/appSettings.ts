import { supabase, handleSupabaseError } from './supabase';

/**
 * Utility functions for fetching application settings from the database
 * Includes caching mechanism to prevent excessive database queries
 */

// In-memory cache for settings
const settingsCache: Record<string, { value: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetch an application setting from the database with caching
 * @param key The setting key to retrieve
 * @param defaultValue Default value to return if setting doesn't exist
 * @returns The setting value or default value
 */
export async function getAppSetting<T>(key: string, defaultValue: T): Promise<T> {
  // Check cache first
  const cached = settingsCache[key];
  const now = Date.now();
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log(`AppSettings: Using cached value for ${key}`);
    return cached.value;
  }
  
  try {
    console.log(`AppSettings: Fetching setting from database: ${key}`);
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();
    
    if (error) {
      console.error(`AppSettings: Failed to fetch setting: ${key}`, error);
      return defaultValue;
    }
    
    // Update cache
    const value = data?.setting_value || defaultValue;
    settingsCache[key] = { value, timestamp: now };
    
    return value;
  } catch (error) {
    console.error(`AppSettings: Error getting setting: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Fetch the lifetime plan price from database settings
 * @returns The lifetime plan price as a string (e.g. "79.99")
 */
export async function getLifetimePlanPrice(): Promise<string> {
  const setting = await getAppSetting<{price: string, currency: string}>(
    'lifetime_plan_price', 
    {price: '79.99', currency: 'USD'}
  );
  
  console.log('AppSettings: Lifetime plan price:', setting.price);
  return setting.price;
}

/**
 * Fetch app settings for frontend initialization
 * Loads common settings needed by the application
 */
export async function loadAppSettings(): Promise<{
  lifetimePlanPrice: string;
  // Add other settings as needed
}> {
  const [lifetimePlanPrice] = await Promise.all([
    getLifetimePlanPrice(),
    // Add other setting fetches here
  ]);
  
  return {
    lifetimePlanPrice
  };
}