import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { AppState, AppStateStatus } from 'react-native';
import { IS_FORCE_LOGOUT } from '../constants';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'refreshing';
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'refreshing'
  >('connecting');

  // Manual refresh session function (simplified)
  const refreshSession = async () => {
    try {
      setConnectionStatus('refreshing');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Error refreshing session:', error);
        setConnectionStatus('disconnected');
      } else if (data.session) {
        console.log('✅ Session refreshed successfully');
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('❌ Unexpected error refreshing session:', error);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    // Initialize authentication
    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      setConnectionStatus('connecting');

      // Get current session from Supabase (handles restoration automatically)
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        console.log('📱 Found current session - Database connected');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        setConnectionStatus('connected');
      } else {
        console.log('📭 No current session found');
        setConnectionStatus('disconnected');
      }
      
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('🔗 Database connection established for user:', session.user.email);
        await fetchProfile(session.user.id);
        setConnectionStatus('connected');
      } else {
        console.log('🔌 Database connection closed');
        setProfile(null);
        setConnectionStatus('disconnected');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && session) {
        if (IS_FORCE_LOGOUT) {
          await supabase.auth.signOut();
        } else {
          console.log('📱 App came to foreground, checking connection...');
          // Let Supabase handle session refresh automatically
          setConnectionStatus('connected');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
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
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      setConnectionStatus('connecting');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        setConnectionStatus('disconnected');
      } else if (data.session) {
        console.log('✅ Sign in successful');
        setConnectionStatus('connected');
      }

      return { error };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => {
    try {
      console.log('📝 Attempting sign up for:', email, 'with username:', username);
      setConnectionStatus('connecting');

      // First check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        setConnectionStatus('disconnected');
        return {
          error: {
            message: 'Username is already taken. Please choose a different one.',
          },
        };
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        setConnectionStatus('disconnected');
        return { error };
      }

      console.log('✅ Sign up successful, creating profile in database...');

      // Create profile in database
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
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
      console.log('🚪 Signing out...');
      setConnectionStatus('disconnected');

      const { error } = await supabase.auth.signOut();

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}