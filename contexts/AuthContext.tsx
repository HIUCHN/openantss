import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'supabase.auth.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Store session securely
  const storeSession = async (session: Session | null) => {
    try {
      if (session) {
        const sessionData = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user,
        });
        
        if (Platform.OS === 'web') {
          localStorage.setItem(SESSION_KEY, sessionData);
        } else {
          await SecureStore.setItemAsync(SESSION_KEY, sessionData);
        }
        console.log('✅ Session stored securely');
      } else {
        // Remove session when null
        if (Platform.OS === 'web') {
          localStorage.removeItem(SESSION_KEY);
        } else {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
        console.log('🗑️ Session removed from secure storage');
      }
    } catch (error) {
      console.error('❌ Error storing session:', error);
    }
  };

  // Restore session from secure storage
  const restoreSession = async () => {
    try {
      let storedSession: string | null = null;
      
      if (Platform.OS === 'web') {
        storedSession = localStorage.getItem(SESSION_KEY);
      } else {
        storedSession = await SecureStore.getItemAsync(SESSION_KEY);
      }

      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        console.log('🔄 Restoring session from secure storage');
        
        // Set the session in Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });

        if (error) {
          console.error('❌ Error restoring session:', error);
          // Remove invalid session
          if (Platform.OS === 'web') {
            localStorage.removeItem(SESSION_KEY);
          } else {
            await SecureStore.deleteItemAsync(SESSION_KEY);
          }
        } else if (data.session) {
          console.log('✅ Session restored successfully');
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
        }
      }
    } catch (error) {
      console.error('❌ Error restoring session:', error);
      // Clean up corrupted session data
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem(SESSION_KEY);
        } else {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up session:', cleanupError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      
      // First try to get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('📱 Found current session');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        await storeSession(currentSession);
      } else {
        console.log('🔍 No current session, trying to restore from storage...');
        await restoreSession();
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store or remove session
      await storeSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground, checking session...');
        
        // Try to refresh the current session
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.log('🔄 Session refresh failed, trying to restore from storage...');
          await restoreSession();
        } else if (data.session) {
          console.log('✅ Session refreshed successfully');
          setSession(data.session);
          setUser(data.session.user);
          await storeSession(data.session);
          
          if (data.session.user && !profile) {
            await fetchProfile(data.session.user.id);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [profile]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error);
      } else if (data) {
        console.log('✅ Profile fetched successfully');
        setProfile(data);
      } else {
        console.log('👤 No profile found');
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
      } else if (data.session) {
        console.log('✅ Sign in successful');
        // Session will be automatically stored via auth state change
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      console.log('📝 Attempting sign up for:', email, 'with username:', username);
      
      // First check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        return { error: { message: 'Username is already taken. Please choose a different one.' } };
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error };
      }

      console.log('✅ Sign up successful, creating profile...');

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            email,
            full_name: fullName,
            is_public: true,
            proximity_alerts: true,
            direct_messages: false,
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
          return { error: profileError };
        }
        
        console.log('✅ Profile created successfully');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      // Clear stored session
      await storeSession(null);
      
      if (error) {
        console.error('❌ Error signing out:', error);
      } else {
        console.log('✅ Sign out successful');
      }
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('👤 Updating profile with:', updates);
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
        console.log('✅ Profile updated successfully');
      } else if (error) {
        console.error('❌ Error updating profile:', error);
      }

      return { error };
    } catch (error) {
      console.error('❌ Unexpected profile update error:', error);
      return { error };
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}