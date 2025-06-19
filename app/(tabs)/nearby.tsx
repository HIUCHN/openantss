import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { MapPin, Users, MessageCircle, UserPlus, X, Navigation, RefreshCw, Settings, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import MapBoxMap from '@/components/MapBoxMap';
import AccountSettingsModal from '@/components/AccountSettingsModal';

interface NearbyUser {
  id: string;
  name: string;
  role: string;
  company: string;
  latitude: number;
  longitude: number;
  distance: number;
  lastSeen: string;
  image: string;
  pinColor: string;
  statusText: string;
  bio?: string;
  skills?: string[];
  isOnline: boolean;
}

export default function NearbyScreen() {
  const { profile, storeUserLocation, getNearbyUsers, togglePublicMode, clearUserLocation } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [showNearbyMetrics, setShowNearbyMetrics] = useState(true); // New state for toggling metrics
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Check if user has public mode enabled
  const isPublicMode = profile?.is_public ?? false;

  useEffect(() => {
    // Only initialize location if public mode is enabled
    if (isPublicMode) {
      initializeLocation();
    } else {
      // Clean up when not in public mode
      cleanup();
      setLocation(null);
      setNearbyUsers([]);
      setErrorMessage(null);
    }

    return () => {
      cleanup();
    };
  }, [isPublicMode]);

  useEffect(() => {
    if (isPublicMode && location) {
      startLocationTracking();
      startPeriodicRefresh();
    } else {
      stopLocationTracking();
      stopPeriodicRefresh();
    }
  }, [isPublicMode, location]);

  const cleanup = () => {
    stopLocationTracking();
    stopPeriodicRefresh();
  };

  const initializeLocation = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setErrorMessage('Location services are disabled. Please enable them in your device settings.');
        setLoading(false);
        return;
      }

      // Request location permissions with more specific permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        setErrorMessage('Location permission is required to see nearby professionals. Please grant permission in settings.');
        setLoading(false);
        return;
      }

      // Get current location with high accuracy
      console.log('📍 Getting high-accuracy location...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
        maximumAge: 10000, // Use cached location if less than 10 seconds old
        timeout: 15000, // 15 second timeout
      });

      console.log('📍 Location obtained:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });

      setLocation(currentLocation);
      setLocationAccuracy(currentLocation.coords.accuracy || null);

      if (isPublicMode) {
        // Store location in database
        await storeUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || undefined,
          altitude: currentLocation.coords.altitude || undefined,
          heading: currentLocation.coords.heading || undefined,
          speed: currentLocation.coords.speed || undefined,
          timestamp: new Date(currentLocation.timestamp),
        });

        // Fetch nearby users
        await fetchNearbyUsers();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      if (error.code === 'E_LOCATION_TIMEOUT') {
        setErrorMessage('Location request timed out. Please try again.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        setErrorMessage('Location is temporarily unavailable. Please try again.');
      } else {
        setErrorMessage('Failed to get your location. Please check your GPS settings and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    if (isTrackingLocation || !isPublicMode) return;

    try {
      setIsTrackingLocation(true);
      console.log('📍 Starting high-accuracy location tracking...');
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
          timeInterval: 15000, // Update every 15 seconds (more frequent)
          distanceInterval: 10, // Update when moved 10 meters (more sensitive)
        },
        async (newLocation) => {
          console.log('📍 Location updated:', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
          });

          setLocation(newLocation);
          setLocationAccuracy(newLocation.coords.accuracy || null);
          
          // Only store location if still in public mode
          if (isPublicMode) {
            await storeUserLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy || undefined,
              altitude: newLocation.coords.altitude || undefined,
              heading: newLocation.coords.heading || undefined,
              speed: newLocation.coords.speed || undefined,
              timestamp: new Date(newLocation.timestamp),
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTrackingLocation(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('✅ Location tracking stopped successfully');
      } catch (error) {
        console.error('❌ Error stopping location tracking:', error);
        locationSubscription.current = null;
      }
    }
    setIsTrackingLocation(false);
  };

  const startPeriodicRefresh = () => {
    if (refreshInterval.current) return;

    refreshInterval.current = setInterval(() => {
      if (isPublicMode && location) {
        fetchNearbyUsers();
      }
    }, 30000); // Refresh every 30 seconds (more frequent)
  };

  const stopPeriodicRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  };

  const fetchNearbyUsers = async () => {
    if (!isPublicMode || !location) return;

    try {
      const { data, error } = await getNearbyUsers(2000); // 2km radius
      
      if (error) {
        console.error('Error fetching nearby users:', error);
        return;
      }

      if (data) {
        const formattedUsers: NearbyUser[] = data.map((userLocation: any, index: number) => {
          const user = userLocation.profiles;
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            userLocation.latitude,
            userLocation.longitude
          );

          // Assign different pin colors based on role or randomly
          const pinColors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
          const pinColor = pinColors[index % pinColors.length];

          return {
            id: user.id,
            name: user.full_name || user.username,
            role: user.role || 'Professional',
            company: user.company || 'OpenAnts',
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            distance: Math.round(distance),
            lastSeen: formatLastSeen(userLocation.timestamp),
            image: user.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            pinColor,
            statusText: distance < 100 ? 'Very Close' : distance < 500 ? 'Nearby' : 'In Area',
            bio: user.bio,
            skills: user.skills,
            isOnline: isRecentLocation(userLocation.timestamp),
          };
        });

        setNearbyUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  };

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

    return R * c;
  };

  const formatLastSeen = (timestamp: string): string => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isRecentLocation = (timestamp: string): boolean => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    return diffMs < 300000; // 5 minutes
  };

  const handleRefresh = async () => {
    if (!isPublicMode) return;
    
    setRefreshing(true);
    // Refresh both location and nearby users
    await initializeLocation();
    setRefreshing(false);
  };

  const handleUserPinPress = (user: NearbyUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleTogglePublicMode = async () => {
    if (isTogglingMode) return;

    try {
      setIsTogglingMode(true);
      const newValue = !isPublicMode;
      
      console.log('🔄 Toggling public mode from', isPublicMode, 'to', newValue);
      
      const { error } = await togglePublicMode(newValue);
      
      if (error) {
        console.error('❌ Error toggling public mode:', error);
        Alert.alert('Error', 'Failed to update location sharing settings. Please try again.');
        return;
      }

      if (!newValue) {
        console.log('🗑️ Clearing location data for private mode');
        await clearUserLocation();
        
        cleanup();
        setLocation(null);
        setNearbyUsers([]);
        setErrorMessage(null);
      }

      const message = newValue 
        ? 'Location sharing enabled. You can now see and be seen by nearby professionals.'
        : 'Location sharing disabled. Your location is no longer visible to others.';
      
      Alert.alert(
        newValue ? 'Public Mode Enabled' : 'Private Mode Enabled', 
        message,
        [{ text: 'Got it' }]
      );

      console.log('✅ Public mode toggled successfully to:', newValue);
    } catch (error) {
      console.error('❌ Unexpected error toggling public mode:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsTogglingMode(false);
    }
  };

  const getLocationAccuracyText = () => {
    if (!locationAccuracy) return '';
    if (locationAccuracy < 10) return 'Very High Accuracy';
    if (locationAccuracy < 50) return 'High Accuracy';
    if (locationAccuracy < 100) return 'Good Accuracy';
    return 'Low Accuracy';
  };

  const getLocationAccuracyColor = () => {
    if (!locationAccuracy) return '#6B7280';
    if (locationAccuracy < 10) return '#10B981';
    if (locationAccuracy < 50) return '#F59E0B';
    if (locationAccuracy < 100) return '#EF4444';
    return '#6B7280';
  };

  const UserModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Professional Profile</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.userHeader}>
                <Image source={{ uri: selectedUser.image }} style={styles.userImage} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{selectedUser.name}</Text>
                  <Text style={styles.userRole}>{selectedUser.role}</Text>
                  <Text style={styles.userCompany}>{selectedUser.company}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: selectedUser.isOnline ? '#10B981' : '#6B7280' }
                    ]} />
                    <Text style={styles.statusText}>
                      {selectedUser.isOnline ? 'Active now' : selectedUser.lastSeen}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.distanceCard}>
                <MapPin size={16} color="#6366F1" />
                <Text style={styles.distanceText}>
                  {selectedUser.distance}m away • {selectedUser.statusText}
                </Text>
              </View>

              {selectedUser.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.bioText}>{selectedUser.bio}</Text>
                </View>
              )}

              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <View style={styles.skillsSection}>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  <View style={styles.skillsContainer}>
                    {selectedUser.skills.slice(0, 6).map((skill, index) => (
                      <View key={index} style={styles.skillTag}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.connectButton}>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <MessageCircle size={18} color="#6366F1" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const PermissionScreen = () => (
    <View style={styles.permissionContainer}>
      <View style={styles.permissionContent}>
        <View style={styles.permissionIcon}>
          <MapPin size={48} color="#6366F1" />
        </View>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionDescription}>
          To see nearby professionals and enable networking opportunities, we need access to your location.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={initializeLocation}>
          <Text style={styles.permissionButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PrivateModeScreen = () => (
    <View style={styles.privateModeContainer}>
      <View style={styles.privateModeContent}>
        <View style={styles.privateModeIcon}>
          <EyeOff size={48} color="#6B7280" />
        </View>
        <Text style={styles.privateModeTitle}>Private Mode Enabled</Text>
        <Text style={styles.privateModeDescription}>
          Your location is not being shared. Enable Public Mode to see nearby professionals and be discoverable by others.
        </Text>
        <TouchableOpacity 
          style={[styles.enablePublicButton, isTogglingMode && styles.buttonDisabled]} 
          onPress={handleTogglePublicMode}
          disabled={isTogglingMode}
        >
          {isTogglingMode ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Eye size={18} color="#FFFFFF" />
              <Text style={styles.enablePublicButtonText}>Enable Public Mode</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const ErrorScreen = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Unable to Load Nearby Users</Text>
        <Text style={styles.errorDescription}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
          <RefreshCw size={18} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Getting your precise location...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds for best accuracy</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && locationPermission !== 'granted' && isPublicMode) {
    return (
      <SafeAreaView style={styles.container}>
        <PermissionScreen />
      </SafeAreaView>
    );
  }

  if (!isPublicMode) {
    return (
      <SafeAreaView style={styles.container}>
        <PrivateModeScreen />
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Nearby Professionals</Text>
          <View style={styles.userCount}>
            <Users size={16} color="#6366F1" />
            <Text style={styles.userCountText}>{nearbyUsers.length} nearby</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={refreshing || !isPublicMode}
          >
            <RefreshCw 
              size={20} 
              color="#6366F1" 
              style={refreshing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowAccountSettings(true)}
          >
            <Settings size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Banner */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.statusBanner}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            <View style={styles.statusIcon}>
              <Eye size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.statusTitle}>Public Mode Active</Text>
              <View style={styles.statusSubtitleRow}>
                <Text style={styles.statusSubtitle}>
                  {isTrackingLocation ? 'Live tracking' : 'Location shared'}
                </Text>
                {locationAccuracy && (
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.accuracyText}>{getLocationAccuracyText()}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.toggleButton, isTogglingMode && styles.buttonDisabled]}
            onPress={handleTogglePublicMode}
            disabled={isTogglingMode}
          >
            {isTogglingMode ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.toggleButtonText}>Turn Off</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Large Map Container */}
      <View style={styles.largeMapContainer}>
        {location && (
          <MapBoxMap
            userLocations={nearbyUsers}
            currentUserLocation={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
              timestamp: location.timestamp,
            }}
            onUserPinPress={handleUserPinPress}
            style={styles.map}
          />
        )}
        
        {/* Map Overlay Info */}
        <View style={styles.mapOverlay}>
          <View style={styles.mapInfo}>
            <Navigation size={12} color="#FFFFFF" />
            <Text style={styles.mapInfoText}>
              {locationAccuracy ? `±${Math.round(locationAccuracy)}m` : 'Locating...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Clickable Nearby Metrics */}
      <TouchableOpacity 
        style={styles.nearbyMetricsToggle}
        onPress={() => setShowNearbyMetrics(!showNearbyMetrics)}
        activeOpacity={0.7}
      >
        <View style={styles.metricsHeader}>
          <View style={styles.metricsHeaderLeft}>
            <Users size={18} color="#6366F1" />
            <Text style={styles.metricsTitle}>Nearby Professionals ({nearbyUsers.length})</Text>
          </View>
          <View style={styles.metricsHeaderRight}>
            {showNearbyMetrics ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Collapsible User List */}
      {showNearbyMetrics && (
        <View style={styles.nearbyUsersList}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.userList}
            contentContainerStyle={styles.userListContent}
          >
            {nearbyUsers.map((user) => (
              <TouchableOpacity 
                key={user.id} 
                style={styles.compactUserCard}
                onPress={() => handleUserPinPress(user)}
              >
                <Image source={{ uri: user.image }} style={styles.compactUserImage} />
                <Text style={styles.compactUserName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.compactUserDistance}>{user.distance}m</Text>
                <View style={[
                  styles.compactUserStatus,
                  { backgroundColor: user.isOnline ? '#10B981' : '#6B7280' }
                ]} />
              </TouchableOpacity>
            ))}
            
            {nearbyUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Users size={24} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No one nearby</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <UserModal />
      
      <AccountSettingsModal 
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  userCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCountText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    // Note: In a real app, you'd use react-native-reanimated for the spinning animation
  },
  settingsButton: {
    padding: 8,
  },
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  statusSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  accuracyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Large Map Container - Takes up most of the screen
  largeMapContainer: {
    flex: 1,
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  mapInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mapInfoText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  // Clickable Nearby Metrics Toggle
  nearbyMetricsToggle: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  metricsHeaderRight: {
    padding: 4,
  },
  // Collapsible User List
  nearbyUsersList: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 8,
    maxHeight: 120,
  },
  userList: {
    paddingLeft: 16,
  },
  userListContent: {
    paddingRight: 16,
  },
  compactUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    width: 90,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  compactUserName: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  compactUserDistance: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  compactUserStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: 140,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#EEF2FF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  privateModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  privateModeContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  privateModeIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  privateModeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  privateModeDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  enablePublicButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 160,
  },
  enablePublicButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  userModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  userCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  bioSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  skillsSection: {
    marginBottom: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
});