import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { loadCredentials, saveCredentials, supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import { AppState, AppStateStatus } from 'react-native';
import { IS_FORCE_LOGIN, IS_FORCE_LOGOUT } from '../constants';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserLocation = Database['public']['Tables']['user_location']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];
type ConnectionRequest = Database['public']['Tables']['connection_requests']['Row'];

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
  // Post management functions
  createPost: (content: string, tags?: string[]) => Promise<{ data: Post | null; error: any }>;
  getPosts: (limit?: number) => Promise<{ data: Post[] | null; error: any }>;
  likePost: (postId: string) => Promise<{ error: any }>;
  unlikePost: (postId: string) => Promise<{ error: any }>;
  deletePost: (postId: string) => Promise<{ error: any }>;
  // Comment management functions
  createComment: (postId: string, content: string, parentCommentId?: string) => Promise<{ data: Comment | null; error: any }>;
  getComments: (postId: string) => Promise<{ data: Comment[] | null; error: any }>;
  deleteComment: (commentId: string) => Promise<{ error: any }>;
  // Connection request functions
  sendConnectionRequest: (receiverId: string, message: string) => Promise<{ error: any }>;
  getConnectionRequests: () => Promise<{ data: ConnectionRequest[] | null; error: any }>;
  acceptConnectionRequest: (requestId: string) => Promise<{ error: any }>;
  declineConnectionRequest: (requestId: string) => Promise<{ error: any }>;
  checkConnectionStatus: (userId: string) => Promise<{ data: { isConnected: boolean; hasPendingRequest: boolean; requestId?: string } | null; error: any }>;
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
            await supabase.auth.signInWithPassword({
                email,
                password,
            });
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

  const getNearbyUsers = async (radius: number = 2000) => {
    if (!user) {
      console.log('❌ No user logged in for nearby users search');
      return { data: null, error: new Error('No user logged in') };
    }

    if (!profile?.is_public) {
      console.log('❌ User is in private mode, cannot search for nearby users');
      return { data: null, error: new Error('User must be in public mode to see nearby users') };
    }

    if (!profile?.latitude || !profile?.longitude) {
      console.log('❌ User location not available for nearby search');
      return { data: null, error: new Error('User location not available') };
    }

    try {
      console.log('🔍 Fetching nearby users within', radius, 'meters...');
      console.log('📍 Current user location:', { lat: profile.latitude, lng: profile.longitude });
      
      // First, let's get all public users with location data from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, role, company, is_public, latitude, longitude, last_location_update')
        .eq('is_public', true)
        .neq('id', user.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (profilesError) {
        console.error('❌ Error fetching profiles with location:', profilesError);
        return { data: null, error: profilesError };
      }

      console.log('📊 Found', profilesData?.length || 0, 'public profiles with location data');

      if (!profilesData || profilesData.length === 0) {
        console.log('📭 No public users with location found');
        return { data: [], error: null };
      }

      // Filter by distance and transform to expected format
      const userLat = profile.latitude;
      const userLng = profile.longitude;
      
      const nearbyUsers = profilesData
        .map((profileLocation: any) => {
          const distance = calculateDistance(
            userLat,
            userLng,
            profileLocation.latitude,
            profileLocation.longitude
          );
          
          return {
            ...profileLocation,
            distance,
            // Transform to match expected format
            profiles: {
              id: profileLocation.id,
              username: profileLocation.username,
              full_name: profileLocation.full_name,
              avatar_url: profileLocation.avatar_url,
              role: profileLocation.role,
              company: profileLocation.company,
              is_public: profileLocation.is_public,
            },
            // Add timestamp for compatibility
            timestamp: profileLocation.last_location_update || new Date().toISOString(),
          };
        })
        .filter((location: any) => location.distance <= radius)
        .sort((a: any, b: any) => a.distance - b.distance);

      console.log('✅ Found', nearbyUsers.length, 'nearby users within', radius, 'meters');
      
      // Log details for debugging
      nearbyUsers.forEach((user: any, index: number) => {
        console.log(`👤 User ${index + 1}:`, {
          name: user.full_name || user.username,
          distance: Math.round(user.distance),
          location: { lat: user.latitude, lng: user.longitude }
        });
      });

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

  // Post management functions
  const createPost = async (content: string, tags: string[] = []) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      console.log('📝 Creating new post...');
      
      const postData = {
        author_id: user.id,
        content: content.trim(),
        type: 'text' as const,
        tags: tags.length > 0 ? tags : null,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creating post:', error);
        return { data: null, error };
      }

      console.log('✅ Post created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error creating post:', error);
      return { data: null, error };
    }
  };

  const getPosts = async (limit: number = 20) => {
    try {
      console.log('📰 Fetching posts from database...');
      
      const { data, error } = await supabase
        .from('posts')
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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching posts:', error);
        return { data: null, error };
      }

      // Filter posts from public profiles only (unless it's the current user's post)
      const filteredPosts = data?.filter((post: any) => 
        post.profiles.is_public || post.author_id === user?.id
      ) || [];

      console.log('✅ Posts fetched successfully:', filteredPosts.length, 'posts');
      return { data: filteredPosts, error: null };
    } catch (error) {
      console.error('❌ Unexpected error fetching posts:', error);
      return { data: null, error };
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('👍 Liking post:', postId);
      
      // Increment likes count
      const { error } = await supabase.rpc('increment_post_likes', {
        post_id: postId
      });

      if (error) {
        console.error('❌ Error liking post:', error);
        return { error };
      }

      console.log('✅ Post liked successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error liking post:', error);
      return { error };
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('👎 Unliking post:', postId);
      
      // Decrement likes count (but don't go below 0)
      const { error } = await supabase.rpc('decrement_post_likes', {
        post_id: postId
      });

      if (error) {
        console.error('❌ Error unliking post:', error);
        return { error };
      }

      console.log('✅ Post unliked successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error unliking post:', error);
      return { error };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('🗑️ Deleting post:', postId);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id); // Ensure user can only delete their own posts

      if (error) {
        console.error('❌ Error deleting post:', error);
        return { error };
      }

      console.log('✅ Post deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error deleting post:', error);
      return { error };
    }
  };

  // Comment management functions
  const createComment = async (postId: string, content: string, parentCommentId?: string) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      console.log('💬 Creating new comment for post:', postId);
      
      const commentData = {
        post_id: postId,
        author_id: user.id,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
        likes_count: 0,
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select(`
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creating comment:', error);
        return { data: null, error };
      }

      console.log('✅ Comment created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error creating comment:', error);
      return { data: null, error };
    }
  };

  const getComments = async (postId: string) => {
    try {
      console.log('💬 Fetching comments for post:', postId);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching comments:', error);
        return { data: null, error };
      }

      console.log('✅ Comments fetched successfully:', data?.length || 0, 'comments');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Unexpected error fetching comments:', error);
      return { data: null, error };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('🗑️ Deleting comment:', commentId);
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', user.id); // Ensure user can only delete their own comments

      if (error) {
        console.error('❌ Error deleting comment:', error);
        return { error };
      }

      console.log('✅ Comment deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error deleting comment:', error);
      return { error };
    }
  };

  // Connection request functions
  const sendConnectionRequest = async (receiverId: string, message: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('🤝 Sending connection request to:', receiverId);
      
      // Check if a request already exists (use maybeSingle to handle no results)
      const { data: existingRequest, error: checkError } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('sender_id', user.id)
        .eq('receiver_id', receiverId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing request:', checkError);
        return { error: checkError };
      }

      if (existingRequest) {
        return { error: new Error('Connection request already sent') };
      }

      // Check if users are already connected (use maybeSingle to handle no results)
      const { data: existingConnection, error: connectionError } = await supabase
        .from('connections')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (connectionError) {
        console.error('❌ Error checking existing connection:', connectionError);
        return { error: connectionError };
      }

      if (existingConnection) {
        return { error: new Error('Already connected with this user') };
      }

      // Send the connection request
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message.trim(),
          status: 'pending'
        });

      if (error) {
        console.error('❌ Error sending connection request:', error);
        return { error };
      }

      console.log('✅ Connection request sent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error sending connection request:', error);
      return { error };
    }
  };

  const getConnectionRequests = async () => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      console.log('📨 Fetching connection requests...');
      
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          sender:profiles!connection_requests_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching connection requests:', error);
        return { data: null, error };
      }

      console.log('✅ Connection requests fetched successfully:', data?.length || 0, 'requests');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Unexpected error fetching connection requests:', error);
      return { data: null, error };
    }
  };

  const acceptConnectionRequest = async (requestId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('✅ Accepting connection request:', requestId);
      
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from('connection_requests')
        .select('sender_id, receiver_id')
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .single();

      if (fetchError || !request) {
        console.error('❌ Error fetching connection request:', fetchError);
        return { error: fetchError || new Error('Request not found') };
      }

      // Check if connection already exists before creating a new one
      const { data: existingConnection, error: connectionCheckError } = await supabase
        .from('connections')
        .select('id')
        .or(`and(user1_id.eq.${request.sender_id},user2_id.eq.${request.receiver_id}),and(user1_id.eq.${request.receiver_id},user2_id.eq.${request.sender_id})`)
        .maybeSingle();

      if (connectionCheckError) {
        console.error('❌ Error checking existing connection:', connectionCheckError);
        return { error: connectionCheckError };
      }

      if (existingConnection) {
        console.log('⚠️ Connection already exists, just removing the request');
        // Connection already exists, just delete the request
        const { error: deleteError } = await supabase
          .from('connection_requests')
          .delete()
          .eq('id', requestId);

        if (deleteError) {
          console.error('❌ Error deleting connection request:', deleteError);
          return { error: deleteError };
        }

        console.log('✅ Connection request removed (connection already existed)');
        return { error: null };
      }

      // Create the connection
      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          user1_id: request.sender_id,
          user2_id: request.receiver_id
        });

      if (connectionError) {
        console.error('❌ Error creating connection:', connectionError);
        return { error: connectionError };
      }

      // Delete the request
      const { error: deleteError } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        console.error('❌ Error deleting connection request:', deleteError);
        return { error: deleteError };
      }

      console.log('✅ Connection request accepted successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error accepting connection request:', error);
      return { error };
    }
  };

  const declineConnectionRequest = async (requestId: string) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('❌ Declining connection request:', requestId);
      
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (error) {
        console.error('❌ Error declining connection request:', error);
        return { error };
      }

      console.log('✅ Connection request declined successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error declining connection request:', error);
      return { error };
    }
  };

  const checkConnectionStatus = async (userId: string) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      console.log('🔍 Checking connection status with user:', userId);
      
      // Check if already connected (use maybeSingle to handle no results)
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (connectionError) {
        console.error('❌ Error checking connection:', connectionError);
        return { data: null, error: connectionError };
      }

      if (connection) {
        return { 
          data: { isConnected: true, hasPendingRequest: false }, 
          error: null 
        };
      }

      // Check if there's a pending request (use maybeSingle to handle no results)
      const { data: request, error: requestError } = await supabase
        .from('connection_requests')
        .select('id')
        .eq('sender_id', user.id)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (requestError) {
        console.error('❌ Error checking pending request:', requestError);
        return { data: null, error: requestError };
      }

      return { 
        data: { 
          isConnected: false, 
          hasPendingRequest: !!request,
          requestId: request?.id 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ Unexpected error checking connection status:', error);
      return { data: null, error };
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
    // Post management
    createPost,
    getPosts,
    likePost,
    unlikePost,
    deletePost,
    // Comment management
    createComment,
    getComments,
    deleteComment,
    // Connection request management
    sendConnectionRequest,
    getConnectionRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    checkConnectionStatus,
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