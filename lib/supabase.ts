import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that required environment variables are present
if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Custom session storage using SecureStore
const SessionStorage = {
  getItem: async (key: string) => {
    console.log('anhqn1 - key: ', key)
    if (Platform.OS === 'web') {
      // Fallback to localStorage on web
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from SecureStore:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // Fallback to localStorage on web
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in SecureStore:', error);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      // Fallback to localStorage on web
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from SecureStore:', error);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});