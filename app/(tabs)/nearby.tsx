import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, UserPlus, Settings, Bell, Info, Compass, Layers, Navigation, X, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapBoxMap from '@/components/MapBoxMap';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import DebugPanel from '@/components/DebugPanel';
import { IS_DEBUG } from '@/constants';
import AccountSettingsModal from '@/components/AccountSettingsModal';

// Minimum accuracy threshold in meters
const ACCURACY_THRESHOLD = 20;
// Update interval in milliseconds (1 minute)
const LOCATION_UPDATE_INTERVAL = 60000;
// Maximum age of location data in milliseconds (2 minutes)
const LOCATION_MAX_AGE = 120000;

export default function NearbyScreen() {
  const { profile, togglePublicMode, storeUserLocation, getNearbyUsers } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTogglingPublicMode, setIsTogglingPublicMode] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingNearbyUsers, setIsLoadingNearbyUsers] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [isPublicMode, setIsPublicMode] = useState(profile?.is_public ?? false);
  
  // Refs for tracking
  const watchPositionSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  const lastLocationUpdate = useRef<number>(0);

  // Initialize location tracking
  useEffect(() => {
    if (profile) {
      setIsPublicMode(profile.is_public ?? false);
      
      if (profile.is_public) {
        startLocationTracking();
      } else {
        setIsLoadingLocation(false);
      }
    }
    
    return () => {
      // Clean up location tracking
      stopLocationTracking();
    };
  }, [profile]);

  // Effect for loading nearby users when location changes or public mode changes
  useEffect(() => {
    if (profile?.is_public && location) {
      loadNearbyUsers();
    } else {
      setNearbyUsers([]);
      setIsLoadingNearbyUsers(false);
    }
  }, [location, profile?.is_public]);

  const startLocationTracking = async () => {
    try {
      setIsLoadingLocation(true);
      setErrorMsg(null);
      
      console.log('🔍 Starting location tracking...');
      
      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoadingLocation(false);
        return;
      }
      
      // Get current location with high accuracy
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true
      });
      
      console.log('📍 Initial location obtained:', initialLocation.coords);
      
      // Set initial location
      setLocation(initialLocation);
      
      // Store initial location in database
      await storeLocationInDatabase(initialLocation);
      
      // Start watching position with high accuracy
      watchPositionSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // Update if moved at least 5 meters
          timeInterval: 5000, // Check every 5 seconds
        },
        (newLocation) => {
          // Apply location smoothing
          const smoothedLocation = applyLocationSmoothing(newLocation);
          setLocation(smoothedLocation);
          
          // Only update database at the specified interval
          const now = Date.now();
          if (now - lastLocationUpdate.current >= LOCATION_UPDATE_INTERVAL) {
            storeLocationInDatabase(smoothedLocation);
            lastLocationUpdate.current = now;
          }
        }
      );
      
      // Set up timer for regular database updates
      locationUpdateTimer.current = setInterval(() => {
        if (location) {
          storeLocationInDatabase(location);
        }
      }, LOCATION_UPDATE_INTERVAL);
      
      setIsLoadingLocation(false);
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      setErrorMsg('Failed to start location tracking. Please try again.');
      setIsLoadingLocation(false);
    }
  };

  const stopLocationTracking = () => {
    console.log('🛑 Stopping location tracking...');
    
    // Stop watching position
    if (watchPositionSubscription.current) {
      watchPositionSubscription.current.remove();
      watchPositionSubscription.current = null;
    }
    
    // Clear update timer
    if (locationUpdateTimer.current) {
      clearInterval(locationUpdateTimer.current);
      locationUpdateTimer.current = null;
    }
  };

  const applyLocationSmoothing = (newLocation: Location.LocationObject): Location.LocationObject => {
    // If accuracy is worse than threshold, reject the update
    if (newLocation.coords.accuracy && newLocation.coords.accuracy > ACCURACY_THRESHOLD) {
      console.log(`⚠️ Location update rejected: accuracy (${newLocation.coords.accuracy}m) worse than threshold (${ACCURACY_THRESHOLD}m)`);
      return location || newLocation;
    }
    
    // If this is the first location, just use it
    if (!location) {
      return newLocation;
    }
    
    // Simple exponential smoothing
    // Alpha determines how much weight to give to the new location (0-1)
    // Lower alpha = more smoothing but slower response
    const alpha = 0.3;
    
    const smoothedCoords = {
      latitude: location.coords.latitude * (1 - alpha) + newLocation.coords.latitude * alpha,
      longitude: location.coords.longitude * (1 - alpha) + newLocation.coords.longitude * alpha,
      altitude: newLocation.coords.altitude,
      accuracy: newLocation.coords.accuracy,
      altitudeAccuracy: newLocation.coords.altitudeAccuracy,
      heading: newLocation.coords.heading,
      speed: newLocation.coords.speed
    };
    
    return {
      ...newLocation,
      coords: smoothedCoords
    };
  };

  const storeLocationInDatabase = async (locationData: Location.LocationObject) => {
    try {
      console.log('💾 Storing location in database...');
      
      const { error } = await storeUserLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        altitude: locationData.coords.altitude,
        heading: locationData.coords.heading,
        speed: locationData.coords.speed,
        timestamp: new Date(locationData.timestamp)
      });
      
      if (error) {
        console.error('❌ Error storing location:', error);
      } else {
        console.log('✅ Location stored successfully');
      }
    } catch (error) {
      console.error('❌ Unexpected error storing location:', error);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      setIsLoadingNearbyUsers(true);
      console.log('🔍 Loading nearby users...');
      
      const { data, error } = await getNearbyUsers(5000); // 5km radius
      
      if (error) {
        console.error('❌ Error loading nearby users:', error);
        setErrorMsg('Failed to load nearby users. Please try again.');
      } else {
        console.log('✅ Loaded', data?.length || 0, 'nearby users');
        
        // Transform data for map display
        const transformedUsers = data?.map((user: any, index: number) => {
          // Assign different colors based on index
          const colors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];
          const color = colors[index % colors.length];
          
          return {
            id: user.id,
            name: user.profiles.full_name || user.profiles.username,
            role: user.profiles.role || 'Professional',
            company: user.profiles.company || 'OpenAnts',
            latitude: user.latitude,
            longitude: user.longitude,
            pinColor: color,
            statusText: user.distance < 100 ? 'Very Close' : user.distance < 500 ? 'Nearby' : 'In Area',
            image: user.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
          };
        }) || [];
        
        setNearbyUsers(transformedUsers);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading nearby users:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoadingNearbyUsers(false);
    }
  };

  const handlePublicModeToggle = async (value: boolean) => {
    // Prevent multiple simultaneous toggles
    if (isTogglingPublicMode) {
      console.log('🚫 Toggle already in progress, ignoring...');
      return;
    }

    // Prevent toggling if the value is the same as current state
    if (value === isPublicMode) {
      console.log('🚫 Value is same as current state, ignoring...');
      return;
    }

    setIsTogglingPublicMode(true);
    
    try {
      console.log('🔄 Toggling public mode from', isPublicMode, 'to', value);
      
      const { error } = await togglePublicMode(value);
      
      if (error) {
        console.error('❌ Error toggling public mode:', error);
        Alert.alert(
          'Error', 
          'Failed to update location sharing settings. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Update local state
      setIsPublicMode(value);
      
      // Show feedback to user
      const message = value 
        ? 'Your location is now being shared with nearby professionals. You can find and be found by others in your area.'
        : 'Your location is no longer being shared. You won\'t appear to nearby professionals and your location data has been cleared.';
      
      const title = value ? 'Location Sharing Enabled' : 'Location Sharing Disabled';
      
      Alert.alert(title, message, [{ text: 'Got it' }]);
      
      // Start or stop location tracking based on new value
      if (value) {
        startLocationTracking();
      } else {
        stopLocationTracking();
        setLocation(null);
        setNearbyUsers([]);
      }
      
      console.log('✅ Public mode toggled successfully to:', value);
    } catch (error) {
      console.error('❌ Unexpected error toggling public mode:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Add a small delay to prevent rapid toggles
      setTimeout(() => {
        setIsTogglingPublicMode(false);
      }, 500);
    }
  };

  const handleUserPinPress = (user: any) => {
    setSelectedUser(user);
  };

  const handleCloseUserInfo = () => {
    setSelectedUser(null);
  };

  const handleRefreshLocation = async () => {
    if (!profile?.is_public) {
      Alert.alert(
        'Location Sharing Disabled',
        'Please enable location sharing to see nearby users.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsLoadingLocation(true);
      setErrorMsg(null);
      
      // Get current location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true
      });
      
      console.log('📍 Refreshed location obtained:', currentLocation.coords);
      
      // Set location
      setLocation(currentLocation);
      
      // Store location in database
      await storeLocationInDatabase(currentLocation);
      
      // Reload nearby users
      await loadNearbyUsers();
      
      setIsLoadingLocation(false);
    } catch (error) {
      console.error('❌ Error refreshing location:', error);
      setErrorMsg('Failed to refresh location. Please try again.');
      setIsLoadingLocation(false);
    }
  };

  const handleToggleMapType = () => {
    setMapType(mapType === 'standard' ? 'satellite' : 'standard');
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  const UserInfoCard = ({ user }: { user: any }) => (
    <View style={styles.userInfoCard}>
      <TouchableOpacity style={styles.closeButton} onPress={handleCloseUserInfo}>
        <X size={20} color="#6B7280" />
      </TouchableOpacity>
      
      <View style={styles.userInfoHeader}>
        <Image source={{ uri: user.image }} style={styles.userImage} />
        <View style={styles.userInfoContent}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role} at {user.company}</Text>
          <View style={styles.userLocation}>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.userDistance}>{user.statusText}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.connectButton}>
          <UserPlus size={16} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Nearby</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Debug Toggle Button - Only show when IS_DEBUG is true */}
            {IS_DEBUG && (
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Settings size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image 
                source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.profileImage} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Location Banner */}
      <LinearGradient
        colors={isPublicMode ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
        style={styles.locationBanner}
      >
        <View style={styles.locationContent}>
          <View style={styles.locationLeft}>
            <View style={[styles.locationIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.publicModeText}>
                {isPublicMode ? 'Public Mode' : 'Private Mode'}
              </Text>
              <Text style={styles.locationText}>
                {isPublicMode 
                  ? 'Location sharing enabled' 
                  : 'Location sharing disabled'
                }
              </Text>
            </View>
          </View>
          <View style={styles.switchContainer}>
            {isTogglingPublicMode && (
              <View style={styles.loadingIndicator}>
                <View style={styles.spinner} />
              </View>
            )}
            <Switch
              value={isPublicMode}
              onValueChange={handlePublicModeToggle}
              trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
              thumbColor="#FFFFFF"
              disabled={isTogglingPublicMode}
              style={[
                styles.switch,
                isTogglingPublicMode && styles.switchDisabled
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {isPublicMode ? (
          <>
            {isLoadingLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.errorContainer}>
                <Info size={32} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={handleRefreshLocation}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <MapBoxMap
                  userLocations={nearbyUsers}
                  currentUserLocation={location ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                    timestamp: location.timestamp
                  } : null}
                  onUserPinPress={handleUserPinPress}
                  showUserInfo={!!selectedUser}
                />
                
                {/* Map Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity 
                    style={styles.mapControlButton}
                    onPress={handleRefreshLocation}
                  >
                    <Compass size={20} color="#6366F1" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mapControlButton}
                    onPress={handleToggleMapType}
                  >
                    <Layers size={20} color="#6366F1" />
                  </TouchableOpacity>
                </View>
                
                {/* Nearby Users Count */}
                <View style={styles.nearbyUsersCount}>
                  <Users size={16} color="#FFFFFF" />
                  <Text style={styles.nearbyUsersText}>
                    {isLoadingNearbyUsers 
                      ? 'Searching...' 
                      : `${nearbyUsers.length} nearby`
                    }
                  </Text>
                </View>
                
                {/* Selected User Info */}
                {selectedUser && (
                  <UserInfoCard user={selectedUser} />
                )}
              </>
            )}
          </>
        ) : (
          <View style={styles.disabledContainer}>
            <MapPin size={48} color="#9CA3AF" />
            <Text style={styles.disabledTitle}>Location Sharing Disabled</Text>
            <Text style={styles.disabledText}>
              Enable location sharing to see professionals nearby and allow others to find you.
            </Text>
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={() => handlePublicModeToggle(true)}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.enableButtonText}>Enable Location Sharing</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* Debug Panel - Only show when IS_DEBUG is true */}
      <DebugPanel isVisible={IS_DEBUG && showDebugPanel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugButton: {
    padding: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  locationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  publicModeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF40',
    borderTopColor: '#FFFFFF',
    borderRadius: 8,
    // Note: In a real app, you'd use react-native-reanimated for the spinning animation
  },
  switch: {
    transform: [{ scaleX: 1 }, { scaleY: 1 }],
  },
  switchDisabled: {
    opacity: 0.6,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  disabledTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  enableButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enableButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyUsersCount: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyUsersText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  userInfoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  userInfoHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  userInfoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  userLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userDistance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});