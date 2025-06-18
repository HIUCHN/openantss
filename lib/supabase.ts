import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { encode, decode } from 'base-64';

console.log("anhnq1 create supabase")

// Get environment variables with fallbacks for development
const supabaseUrl = 'https://bduhknjzeuyjjscggzzq.supabase.co' || '';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdWhrbmp6ZXV5ampzY2dnenpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjQ5MDAsImV4cCI6MjA2NTc0MDkwMH0.E1GceD8S4tQcUefbEgzD8pb95CtTm1OWuY6ilgGvUcM' || '';

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

export async function saveCredentials(email: string, password: string) {
  await SessionStorage.setItem('login_email', email);
  await SessionStorage.setItem('login_password', encode(password));
}

export async function loadCredentials() {
  const email = await SessionStorage.getItem('login_email');
  const password = await SessionStorage.getItem('login_password');
  
  return { email: email, password: password ? decode(password) : password };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});