import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { loadCredentials, saveCredentials, supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { AppState, AppStateStatus } from 'react-native';
import { IS_FORCE_LOGIN, IS_FORCE_LOGOUT } from '../constants';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserLocation = Database['public']['Tables']['user_location']['Row'];

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
  updateUserLocation: (latitude: number, longitude: number) => Promise<{ error: any }>;
  storeUserLocation: (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp?: Date;
  }) => Promise<{ error: any }>;
  getUserLocationHistory: (limit?: number) => Promise<{ data: UserLocation[] | null; error: any }>;
  getNearbyUsers: (radius?: number) => Promise<{ data: any[] | null; error: any }>;
  refreshSession: () => Promise<void>;
  togglePublicMode: (isPublic: boolean) => Promise<{ error: any }>;
  clearUserLocation: () => Promise<{ error: any }>;
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
        console.log('📱 App came to foreground');
        if (IS_FORCE_LOGOUT) {
          await supabase.auth.signOut();
        } else if (IS_FORCE_LOGIN) {
          const { email, password } = await loadCredentials();
          console.log("email: ", email, ", password: ", password);
          if (!email || !password) {
            console.log("must logout")
            await supabase.auth.signOut();
          } else {
            console.log("must login")
            await signIn(email, password);
          }
        } else {
          console.log('checking connection...');
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
        .limit(1);

      if (error) {
        console.error('❌ Error fetching profile from database:', error);
      } else if (data && data.length > 0) {
        console.log('✅ Profile fetched successfully from database');
        setProfile(data[0]);
      } else {
        console.log('👤 No profile found in database');
        setProfile(null);
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
        saveCredentials(email, password);
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
        .limit(1);

      if (existingProfile && existingProfile.length > 0) {
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

  const updateUserLocation = async (latitude: number, longitude: number) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('📍 Updating user location in database:', { latitude, longitude });
      
      const locationUpdate = {
        latitude,
        longitude,
        last_location_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(locationUpdate)
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...locationUpdate });
        console.log('✅ User location updated successfully in database');
      } else if (error) {
        console.error('❌ Error updating user location in database:', error);
      }

      return { error };
    } catch (error) {
      console.error('❌ Unexpected location update error:', error);
      return { error };
    }
  };

  const storeUserLocation = async (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp?: Date;
  }) => {
    if (!user) return { error: new Error('No user logged in') };

    // Check if user has public mode enabled
    if (!profile?.is_public) {
      console.log('📍 Location sharing disabled - user is in private mode');
      return { error: null }; // Not an error, just not sharing location
    }

    try {
      console.log('📍 Storing user location in user_location table:', locationData);
      
      const locationRecord = {
        user_id: user.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy || null,
        altitude: locationData.altitude || null,
        heading: locationData.heading || null,
        speed: locationData.speed || null,
        timestamp: (locationData.timestamp || new Date()).toISOString(),
        is_active: true,
      };

      const { error } = await supabase
        .from('user_location')
        .insert(locationRecord);

      if (!error) {
        console.log('✅ User location stored successfully in user_location table');
        
        // Also update the profile table for backward compatibility
        await updateUserLocation(locationData.latitude, locationData.longitude);
      } else {
        console.error('❌ Error storing user location in user_location table:', error);
      }

      return { error };
    } catch (error) {
      console.error('❌ Unexpected error storing user location:', error);
      return { error };
    }
  };

  const getUserLocationHistory = async (limit: number = 50) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      console.log('📍 Fetching user location history...');
      
      const { data, error } = await supabase
        .from('user_location')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching user location history:', error);
      } else {
        console.log('✅ User location history fetched successfully');
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Unexpected error fetching location history:', error);
      return { data: null, error };
    }
  };

  const getNearbyUsers = async (radius: number = 1000) => {
    if (!user || !profile?.latitude || !profile?.longitude) {
      return { data: null, error: new Error('No user location available') };
    }

    try {
      console.log('🔍 Fetching nearby users within', radius, 'meters...');
      
      // This is a simplified proximity search
      // In production, you might want to use PostGIS for more accurate distance calculations
      const { data, error } = await supabase
        .from('user_location')
        .select(`
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company,
            is_public
          )
        `)
        .eq('is_active', true)
        .neq('user_id', user.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('❌ Error fetching nearby users:', error);
        return { data: null, error };
      }

      // Filter by distance (simplified calculation)
      const userLat = profile.latitude;
      const userLng = profile.longitude;
      
      const nearbyUsers = data?.filter((location: any) => {
        if (!location.profiles?.is_public) return false;
        
        const distance = calculateDistance(
          userLat,
          userLng,
          location.latitude,
          location.longitude
        );
        
        return distance <= radius;
      }) || [];

      console.log('✅ Found', nearbyUsers.length, 'nearby users');
      return { data: nearbyUsers, error: null };
    } catch (error) {
      console.error('❌ Unexpected error fetching nearby users:', error);
      return { data: null, error };
    }
  };

  const togglePublicMode = async (isPublic: boolean) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('🔄 Toggling public mode to:', isPublic);

      // Update profile directly in database without using updateProfile to avoid state conflicts
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error updating public mode in database:', error);
        return { error };
      }

      // Update local profile state directly
      if (profile) {
        setProfile({ ...profile, is_public: isPublic });
      }

      console.log('✅ Public mode updated successfully');
      
      // If turning off public mode, clear location data
      if (!isPublic) {
        await clearUserLocation();
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error toggling public mode:', error);
      return { error };
    }
  };

  const clearUserLocation = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('🗑️ Clearing user location data...');

      // Set all user locations to inactive
      const { error: locationError } = await supabase
        .from('user_location')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (locationError) {
        console.error('❌ Error clearing user location data:', locationError);
      }

      // Clear location from profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          latitude: null, 
          longitude: null, 
          last_location_update: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Error clearing profile location:', profileError);
      }

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          latitude: null,
          longitude: null,
          last_location_update: null,
        });
      }

      console.log('✅ User location data cleared successfully');
      return { error: locationError || profileError };
    } catch (error) {
      console.error('❌ Unexpected error clearing location:', error);
      return { error };
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
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
    updateUserLocation,
    storeUserLocation,
    getUserLocationHistory,
    getNearbyUsers,
    refreshSession,
    togglePublicMode,
    clearUserLocation,
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