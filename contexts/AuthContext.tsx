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
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'refreshing';
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'supabase.auth.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'refreshing'>('connecting');

  // Store session securely in device storage
  const storeSession = async (session: Session | null) => {
    try {
      console.log("anhnq1 - session: ", session);
      if (session) {
        const sessionData = JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user,
        });

        console.log("anhnq1 - ", Platform.OS)
        if (Platform.OS === 'web') {
          localStorage.setItem(SESSION_KEY, sessionData);
        } else {
          await SecureStore.setItemAsync(SESSION_KEY, sessionData);
        }
        console.log('✅ Session stored securely in device storage');
      } else {
        // Remove session when null
        if (Platform.OS === 'web') {
          localStorage.removeItem(SESSION_KEY);
        } else {
          await SecureStore.deleteItemAsync(SESSION_KEY);
        }
        console.log('🗑️ Session removed from device storage');
      }
    } catch (error) {
      console.error('❌ Error storing session:', error);
    }
  };

  // Check if session is expired or about to expire (within 5 minutes)
  const isSessionExpired = (session: Session): boolean => {
    if (!session.expires_at) return false;
    const expirationTime = session.expires_at * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (expirationTime - currentTime) <= fiveMinutes;
  };

  // Refresh session using refresh token
  const refreshSessionWithToken = async (refreshToken: string): Promise<Session | null> => {
    try {
      console.log('🔄 Refreshing session with refresh token...');
      setConnectionStatus('refreshing');
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('❌ Error refreshing session:', error);
        setConnectionStatus('disconnected');
        return null;
      }

      if (data.session) {
        console.log('✅ Session refreshed successfully - Database connection restored');
        await storeSession(data.session);
        setConnectionStatus('connected');
        return data.session;
      }

      return null;
    } catch (error) {
      console.error('💥 Unexpected error refreshing session:', error);
      setConnectionStatus('disconnected');
      return null;
    }
  };

  // Restore session from device storage with auto-refresh
  const restoreSession = async () => {
    try {
      setConnectionStatus('connecting');
      let storedSession: string | null = null;
      
      if (Platform.OS === 'web') {
        storedSession = localStorage.getItem(SESSION_KEY);
      } else {
        storedSession = await SecureStore.getItemAsync(SESSION_KEY);
      }

      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        console.log('🔄 Restoring session from device storage...');
        
        // Create a session object
        const restoredSession: Session = {
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
          expires_at: sessionData.expires_at,
          expires_in: sessionData.expires_in,
          token_type: sessionData.token_type || 'bearer',
          user: sessionData.user,
        };

        // Check if session is expired or about to expire
        if (isSessionExpired(restoredSession)) {
          console.log('⏰ Session expired or about to expire, refreshing...');
          const newSession = await refreshSessionWithToken(restoredSession.refresh_token);
          
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            await fetchProfile(newSession.user.id);
          } else {
            // Refresh failed, clear stored session
            await storeSession(null);
            setConnectionStatus('disconnected');
          }
        } else {
          // Session is still valid, set it in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: restoredSession.access_token,
            refresh_token: restoredSession.refresh_token,
          });

          if (error) {
            console.error('❌ Error setting restored session:', error);
            // Try to refresh the session
            const newSession = await refreshSessionWithToken(restoredSession.refresh_token);
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              await fetchProfile(newSession.user.id);
            } else {
              await storeSession(null);
              setConnectionStatus('disconnected');
            }
          } else if (data.session) {
            console.log('✅ Session restored - Database connection established');
            setSession(data.session);
            setUser(data.session.user);
            await fetchProfile(data.session.user.id);
            setConnectionStatus('connected');
          }
        }
      } else {
        console.log('📭 No stored session found');
        setConnectionStatus('disconnected');
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
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh session function
  const refreshSession = async () => {
    if (!session?.refresh_token) {
      console.log('❌ No refresh token available');
      return;
    }

    const newSession = await refreshSessionWithToken(session.refresh_token);
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      if (newSession.user && !profile) {
        await fetchProfile(newSession.user.id);
      }
    }
  };

  useEffect(() => {
    // Initialize authentication and database connection
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication and database connection...');
      
      // First try to get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        console.log('📱 Found current session - Database connected');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        await storeSession(currentSession);
        setConnectionStatus('connected');
      } else {
        console.log('🔍 No current session, trying to restore from device storage...');
        await restoreSession();
      }
    };

    initializeAuth();

    // Listen for auth changes and maintain database connection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session exists - DB connected' : 'No session - DB disconnected');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store or remove session in device storage
      await storeSession(session);
      
      if (session?.user) {
        console.log('🔗 Database connection established for user:', session.user.email);
        await fetchProfile(session.user.id);
        setConnectionStatus('connected');
      } else {
        console.log('🔌 Database connection closed');
        setProfile(null);
        setConnectionStatus('disconnected');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle app state changes (foreground/background) to maintain connection
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && session) {
        console.log('anhnq1 Refreshed session start');
        
        // const { data, error } = await supabase.auth.refreshSession();
        console.log('anhnq1 Refreshed session:');
        
        console.log('📱 App came to foreground, checking database connection...');
        
        // Check if session is expired or about to expire
        if (isSessionExpired(session)) {
          console.log('⏰ Session expired, refreshing...');
          await refreshSession();
        } else {
          // Try to refresh the current session to maintain database connection
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.log('🔄 Session refresh failed, trying manual refresh...');
            await refreshSession();
          } else if (data.session) {
            console.log('✅ Session refreshed - Database connection maintained');
            setSession(data.session);
            setUser(data.session.user);
            await storeSession(data.session);
            setConnectionStatus('connected');
            
            if (data.session.user && !profile) {
              await fetchProfile(data.session.user.id);
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [session, profile]);

  // Auto-refresh session before expiration
  useEffect(() => {
    if (!session) return;

    const checkAndRefreshSession = () => {
      if (isSessionExpired(session)) {
        console.log('⏰ Session about to expire, auto-refreshing...');
        refreshSession();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndRefreshSession, 60000);
    
    return () => clearInterval(interval);
  }, [session]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile from database for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile from database:', error);
      } else if (data) {
        console.log('✅ Profile fetched successfully from database');
        setProfile(data);
      } else {
        console.log('👤 No profile found in database');
      }
    } catch (error) {
      console.error('❌ Error fetching profile from database:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in and database connection for:', email);
      setConnectionStatus('connecting');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        setConnectionStatus('disconnected');
      } else if (data.session) {
        console.log('✅ Sign in successful - Database connection established');
        // Session will be automatically stored via auth state change
        setConnectionStatus('connected');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      console.log('📝 Attempting sign up and database setup for:', email, 'with username:', username);
      setConnectionStatus('connecting');
      
      // First check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        setConnectionStatus('disconnected');
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
        setConnectionStatus('disconnected');
        return { error };
      }

      console.log('✅ Sign up successful, creating profile in database...');

      // Create profile in database
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
          console.error('❌ Error creating profile in database:', profileError);
          setConnectionStatus('disconnected');
          return { error: profileError };
        }
        
        console.log('✅ Profile created successfully in database');
        setConnectionStatus('connected');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out and closing database connection...');
      setConnectionStatus('disconnected');
      
      const { error } = await supabase.auth.signOut();
      
      // Clear stored session from device storage
      await storeSession(null);
      
      if (error) {
        console.error('❌ Error signing out:', error);
      } else {
        console.log('✅ Sign out successful - Database connection closed');
      }
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('👤 Updating profile in database with:', updates);
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
        console.log('✅ Profile updated successfully in database');
      } else if (error) {
        console.error('❌ Error updating profile in database:', error);
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
    connectionStatus,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
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