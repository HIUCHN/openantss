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

// Location smoothing configuration
const LOCATION_HISTORY_SIZE = 5; // Number of recent locations to keep for smoothing
const HIGH_ACCURACY_THRESHOLD = 20; // Meters - threshold for high accuracy
const MEDIUM_ACCURACY_THRESHOLD = 50; // Meters - threshold for medium accuracy
const MAX_RETRY_ATTEMPTS = 5; // Maximum number of retry attempts for high accuracy
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds between location updates
const LOCATION_DISTANCE_FILTER = 1; // 1 meter - minimum distance to trigger update
const DB_UPDATE_THROTTLE = 2000; // 2 seconds - minimum time between database updates

export default function NearbyScreen() {
  const { profile, storeUserLocation, getNearbyUsers, togglePublicMode, clearUserLocation } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [smoothedLocation, setSmoothedLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  } | null>(null);
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
  const [showNearbyMetrics, setShowNearbyMetrics] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for tracking
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const lastDbUpdateTime = useRef<number>(0);
  const locationHistory = useRef<Location.LocationObject[]>([]);
  const isMounted = useRef(true);

  // Check if user has public mode enabled
  const isPublicMode = profile?.is_public ?? false;

  useEffect(() => {
    isMounted.current = true;
    
    // Only initialize location if public mode is enabled
    if (isPublicMode) {
      initializeLocation();
    } else {
      // Clean up when not in public mode
      cleanup();
      setLocation(null);
      setSmoothedLocation(null);
      setNearbyUsers([]);
      setErrorMessage(null);
      setDebugInfo('');
    }

    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [isPublicMode]);

  useEffect(() => {
    if (isPublicMode && smoothedLocation) {
      startLocationTracking();
      startPeriodicRefresh();
    } else {
      stopLocationTracking();
      stopPeriodicRefresh();
    }
  }, [isPublicMode, smoothedLocation]);

  const cleanup = () => {
    stopLocationTracking();
    stopPeriodicRefresh();
    locationHistory.current = [];
  };

  const initializeLocation = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setDebugInfo('Initializing high-precision location tracking...');
      setRetryCount(0);

      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setErrorMessage('Location services are disabled. Please enable them in your device settings to use this feature.');
        setDebugInfo('Location services disabled');
        setLoading(false);
        return;
      }

      // Request location permissions with more specific permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        setErrorMessage('Location permission is required to see nearby professionals. Please grant permission in settings.');
        setDebugInfo('Location permission denied');
        setLoading(false);
        return;
      }

      // Get current location with HIGHEST accuracy
      console.log('🔍 Getting highest-accuracy location...');
      setDebugInfo('Acquiring precise location with maximum accuracy...');
      
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy setting
          maximumAge: 0, // Force fresh location
          timeout: 30000, // Wait longer for better accuracy (30 seconds)
        });

        console.log('📍 High-precision location obtained:', {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        });

        // Add to location history for smoothing
        addToLocationHistory(currentLocation);
        
        // Calculate smoothed location
        const smoothed = calculateSmoothedLocation();
        
        if (smoothed) {
          setLocation(currentLocation);
          setSmoothedLocation(smoothed);
          setLocationAccuracy(currentLocation.coords.accuracy || null);
          
          setDebugInfo(`Precise location acquired: ${smoothed.latitude.toFixed(6)}, ${smoothed.longitude.toFixed(6)} (±${Math.round(currentLocation.coords.accuracy || 0)}m)`);

          if (isPublicMode) {
            // Store location in database
            console.log('📍 Storing high-precision location in database...');
            await storeUserLocationWithThrottle({
              latitude: smoothed.latitude,
              longitude: smoothed.longitude,
              accuracy: currentLocation.coords.accuracy || undefined,
              altitude: currentLocation.coords.altitude || undefined,
              heading: currentLocation.coords.heading || undefined,
              speed: currentLocation.coords.speed || undefined,
              timestamp: new Date(currentLocation.timestamp),
            });

            // Fetch nearby users
            await fetchNearbyUsers();
          }
        } else {
          throw new Error('Failed to calculate smoothed location');
        }
      } catch (locationError) {
        console.error('Error getting high-precision location:', locationError);
        setDebugInfo(`Error getting high-precision location: ${locationError.message}`);
        
        // Retry with slightly lower accuracy if we haven't exceeded retry count
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          setRetryCount(prev => prev + 1);
          setDebugInfo(`Retrying with balanced accuracy (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
          
          const fallbackLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            maximumAge: 10000,
            timeout: 15000,
          });
          
          console.log('📍 Fallback location obtained:', {
            latitude: fallbackLocation.coords.latitude,
            longitude: fallbackLocation.coords.longitude,
            accuracy: fallbackLocation.coords.accuracy,
          });
          
          // Add to location history for smoothing
          addToLocationHistory(fallbackLocation);
          
          // Calculate smoothed location
          const smoothed = calculateSmoothedLocation();
          
          if (smoothed) {
            setLocation(fallbackLocation);
            setSmoothedLocation(smoothed);
            setLocationAccuracy(fallbackLocation.coords.accuracy || null);
            
            setDebugInfo(`Fallback location acquired: ${smoothed.latitude.toFixed(6)}, ${smoothed.longitude.toFixed(6)} (±${Math.round(fallbackLocation.coords.accuracy || 0)}m)`);

            if (isPublicMode) {
              // Store location in database
              await storeUserLocationWithThrottle({
                latitude: smoothed.latitude,
                longitude: smoothed.longitude,
                accuracy: fallbackLocation.coords.accuracy || undefined,
                altitude: fallbackLocation.coords.altitude || undefined,
                heading: fallbackLocation.coords.heading || undefined,
                speed: fallbackLocation.coords.speed || undefined,
                timestamp: new Date(fallbackLocation.timestamp),
              });

              // Fetch nearby users
              await fetchNearbyUsers();
            }
          } else {
            throw new Error('Failed to calculate smoothed location from fallback');
          }
        } else {
          throw locationError;
        }
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      setDebugInfo(`Error: ${error.message}`);
      if (error.code === 'E_LOCATION_TIMEOUT') {
        setErrorMessage('Location request timed out. Please try again in an area with better GPS signal.');
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        setErrorMessage('Location is temporarily unavailable. Please try again in a moment.');
      } else {
        setErrorMessage('Failed to get your location. Please check your GPS settings and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToLocationHistory = (newLocation: Location.LocationObject) => {
    // Add new location to history
    locationHistory.current.push(newLocation);
    
    // Keep only the most recent locations
    if (locationHistory.current.length > LOCATION_HISTORY_SIZE) {
      locationHistory.current.shift(); // Remove oldest location
    }
  };

  const calculateSmoothedLocation = () => {
    if (locationHistory.current.length === 0) return null;
    
    // If we only have one location, return it directly
    if (locationHistory.current.length === 1) {
      const loc = locationHistory.current[0];
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp
      };
    }
    
    // Calculate weighted average based on accuracy and recency
    let totalWeight = 0;
    let latitudeSum = 0;
    let longitudeSum = 0;
    const now = Date.now();
    
    locationHistory.current.forEach(loc => {
      // Calculate weight based on accuracy (higher accuracy = higher weight)
      const accuracyWeight = loc.coords.accuracy ? (1 / Math.max(loc.coords.accuracy, 1)) : 0.1;
      
      // Calculate weight based on recency (more recent = higher weight)
      const ageMs = now - loc.timestamp;
      const recencyWeight = Math.max(0.1, 1 - (ageMs / 60000)); // Reduce weight as age approaches 1 minute
      
      // Combined weight
      const weight = accuracyWeight * recencyWeight;
      
      latitudeSum += loc.coords.latitude * weight;
      longitudeSum += loc.coords.longitude * weight;
      totalWeight += weight;
    });
    
    // Get the most recent location for accuracy and timestamp
    const mostRecent = locationHistory.current[locationHistory.current.length - 1];
    
    return {
      latitude: latitudeSum / totalWeight,
      longitude: longitudeSum / totalWeight,
      accuracy: mostRecent.coords.accuracy,
      timestamp: mostRecent.timestamp
    };
  };

  const startLocationTracking = async () => {
    if (isTrackingLocation || !isPublicMode) return;

    try {
      setIsTrackingLocation(true);
      console.log('📍 Starting continuous high-accuracy location tracking...');
      setDebugInfo('Starting continuous high-accuracy tracking...');
      
      // Stop any existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Always use highest accuracy
          distanceInterval: LOCATION_DISTANCE_FILTER, // Update every 1 meter of movement
          timeInterval: LOCATION_UPDATE_INTERVAL, // Update every 5 seconds
        },
        async (newLocation) => {
          if (!isMounted.current) return;
          
          console.log('📍 Location update received:', {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy,
            timestamp: new Date(newLocation.timestamp).toISOString()
          });
          
          // Check if accuracy is good enough
          const accuracy = newLocation.coords.accuracy || 1000;
          
          if (accuracy > HIGH_ACCURACY_THRESHOLD && retryCount < MAX_RETRY_ATTEMPTS) {
            // Location accuracy is poor, request a better one
            console.log(`⚠️ Low accuracy location (${Math.round(accuracy)}m), requesting better accuracy...`);
            setDebugInfo(`Low accuracy (${Math.round(accuracy)}m), requesting better location...`);
            setRetryCount(prev => prev + 1);
            
            try {
              // Request a one-time high accuracy update
              const betterLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                maximumAge: 0,
                timeout: 10000,
              });
              
              if (betterLocation.coords.accuracy && betterLocation.coords.accuracy <= accuracy) {
                // Only use if it's actually better
                console.log(`✅ Got better accuracy location (${Math.round(betterLocation.coords.accuracy)}m)`);
                addToLocationHistory(betterLocation);
                processNewLocation(betterLocation);
              } else {
                // Still use the original if we couldn't get better
                console.log(`⚠️ Couldn't get better accuracy, using original (${Math.round(accuracy)}m)`);
                addToLocationHistory(newLocation);
                processNewLocation(newLocation);
              }
            } catch (error) {
              console.log(`⚠️ Failed to get better accuracy, using original (${Math.round(accuracy)}m)`);
              addToLocationHistory(newLocation);
              processNewLocation(newLocation);
            }
          } else {
            // Accuracy is good enough, use this location
            addToLocationHistory(newLocation);
            processNewLocation(newLocation);
            setRetryCount(0); // Reset retry count on successful update
          }
        }
      );
      
      console.log('✅ Location tracking started successfully');
      setDebugInfo('Continuous high-accuracy tracking active');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setDebugInfo(`Error starting tracking: ${error.message}`);
      setIsTrackingLocation(false);
      
      // Try to restart with lower accuracy if we failed
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying with balanced accuracy (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
        
        try {
          locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: LOCATION_DISTANCE_FILTER * 2,
              timeInterval: LOCATION_UPDATE_INTERVAL * 2,
            },
            (newLocation) => {
              if (!isMounted.current) return;
              addToLocationHistory(newLocation);
              processNewLocation(newLocation);
            }
          );
          setIsTrackingLocation(true);
          setDebugInfo('Tracking active (balanced accuracy)');
        } catch (fallbackError) {
          console.error('Error starting fallback location tracking:', fallbackError);
          setDebugInfo(`Failed to start tracking: ${fallbackError.message}`);
        }
      }
    }
  };

  const processNewLocation = async (newLocation: Location.LocationObject) => {
    if (!isMounted.current || !isPublicMode) return;
    
    // Calculate smoothed location
    const smoothed = calculateSmoothedLocation();
    if (!smoothed) return;
    
    // Log the difference between raw and smoothed location
    const rawLat = newLocation.coords.latitude;
    const rawLng = newLocation.coords.longitude;
    const smoothedLat = smoothed.latitude;
    const smoothedLng = smoothed.longitude;
    
    const distanceDiff = calculateDistance(
      rawLat, rawLng,
      smoothedLat, smoothedLng
    );
    
    console.log(`📊 Location smoothing: Raw vs Smoothed difference: ${distanceDiff.toFixed(2)}m`);
    
    // Update state with new location
    setLocation(newLocation);
    setSmoothedLocation(smoothed);
    setLocationAccuracy(newLocation.coords.accuracy || null);
    
    // Update debug info
    const accuracyText = newLocation.coords.accuracy 
      ? `±${Math.round(newLocation.coords.accuracy)}m` 
      : 'unknown accuracy';
    
    setDebugInfo(`Location: ${smoothed.latitude.toFixed(6)}, ${smoothed.longitude.toFixed(6)} (${accuracyText})`);
    
    // Store location in database (with throttling)
    await storeUserLocationWithThrottle({
      latitude: smoothed.latitude,
      longitude: smoothed.longitude,
      accuracy: newLocation.coords.accuracy || undefined,
      altitude: newLocation.coords.altitude || undefined,
      heading: newLocation.coords.heading || undefined,
      speed: newLocation.coords.speed || undefined,
      timestamp: new Date(newLocation.timestamp),
    });
  };

  const storeUserLocationWithThrottle = async (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    timestamp: Date;
  }) => {
    // Throttle database updates to prevent overloading
    const now = Date.now();
    if (now - lastDbUpdateTime.current < DB_UPDATE_THROTTLE) {
      console.log('🛑 Throttling database update, too frequent');
      return;
    }
    
    // Skip low accuracy updates
    if (locationData.accuracy && locationData.accuracy > HIGH_ACCURACY_THRESHOLD * 2) {
      console.log(`⚠️ Skipping low accuracy (${Math.round(locationData.accuracy)}m) database update`);
      return;
    }
    
    try {
      lastDbUpdateTime.current = now;
      await storeUserLocation(locationData);
    } catch (error) {
      console.error('Error storing location in database:', error);
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
      if (isPublicMode && smoothedLocation) {
        fetchNearbyUsers();
      }
    }, 30000);
  };

  const stopPeriodicRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  };

  const fetchNearbyUsers = async () => {
    if (!isPublicMode || !smoothedLocation) return;

    try {
      console.log('🔍 Fetching nearby users...');
      const { data, error } = await getNearbyUsers(2000); // 2km radius
      
      if (error) {
        console.error('Error fetching nearby users:', error);
        setDebugInfo(`Error fetching users: ${error.message}`);
        return;
      }

      console.log('📊 Raw nearby users data:', data);

      if (data) {
        const formattedUsers: NearbyUser[] = data.map((userLocation: any, index: number) => {
          const user = userLocation.profiles || userLocation;
          const distance = userLocation.distance || calculateDistance(
            smoothedLocation.latitude,
            smoothedLocation.longitude,
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
            lastSeen: formatLastSeen(userLocation.timestamp || userLocation.last_location_update),
            image: user.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
            pinColor,
            statusText: distance < 100 ? 'Very Close' : distance < 500 ? 'Nearby' : 'In Area',
            bio: user.bio,
            skills: user.skills,
            isOnline: isRecentLocation(userLocation.timestamp || userLocation.last_location_update),
          };
        });

        setNearbyUsers(formattedUsers);
        setDebugInfo(`Found ${formattedUsers.length} nearby users`);
        
        // Log user details for debugging
        console.log('👥 Formatted nearby users:', formattedUsers.map(u => ({
          name: u.name,
          distance: u.distance,
          location: { lat: u.latitude, lng: u.longitude }
        })));
      } else {
        setNearbyUsers([]);
        setDebugInfo('No nearby users found');
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      setDebugInfo(`Fetch error: ${error.message}`);
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
    if (!timestamp) return 'Unknown';
    
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
    if (!timestamp) return false;
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now.getTime() - lastSeen.getTime();
    return diffMs < 300000; // 5 minutes
  };

  const handleRefresh = async () => {
    if (!isPublicMode) return;
    
    setRefreshing(true);
    setDebugInfo('Refreshing location and nearby users...');
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
        setSmoothedLocation(null);
        setNearbyUsers([]);
        setErrorMessage(null);
        setDebugInfo('');
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
    if (locationAccuracy < HIGH_ACCURACY_THRESHOLD) return 'Very High Accuracy';
    if (locationAccuracy < MEDIUM_ACCURACY_THRESHOLD) return 'High Accuracy';
    if (locationAccuracy < 100) return 'Good Accuracy';
    return 'Low Accuracy';
  };

  const getLocationAccuracyColor = () => {
    if (!locationAccuracy) return '#6B7280';
    if (locationAccuracy < HIGH_ACCURACY_THRESHOLD) return '#10B981';
    if (locationAccuracy < MEDIUM_ACCURACY_THRESHOLD) return '#F59E0B';
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
          {debugInfo && (
            <Text style={styles.debugText}>{debugInfo}</Text>
          )}
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
              <Text style={styles.publicModeText}>
                {isPublicMode ? 'Public Mode' : 'Private Mode'}
              </Text>
              <View style={styles.statusSubtitleRow}>
                <Text style={styles.statusSubtitle}>
                  {isTrackingLocation ? 'Live tracking' : 'Location shared'}
                </Text>
                {locationAccuracy && (
                  <View style={[styles.accuracyBadge, { backgroundColor: getLocationAccuracyColor() + '40' }]}>
                    <Text style={[styles.accuracyText, { color: getLocationAccuracyColor() }]}>
                      {getLocationAccuracyText()}
                    </Text>
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

      {/* Debug Info */}
      {debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}

      {/* Extra Large Map Container */}
      <View style={styles.extraLargeMapContainer}>
        {smoothedLocation && (
          <MapBoxMap
            userLocations={nearbyUsers}
            currentUserLocation={{
              latitude: smoothedLocation.latitude,
              longitude: smoothedLocation.longitude,
              accuracy: location?.coords.accuracy || undefined,
              timestamp: location?.timestamp || Date.now(),
            }}
            onUserPinPress={handleUserPinPress}
            style={styles.map}
            showUserInfo={true}
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
  debugContainer: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
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
  publicModeText: {
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
  // Extra Large Map Container - Takes up 3/4 of the screen
  extraLargeMapContainer: {
    flex: 3, // Takes 3/4 of the available space
    margin: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    minHeight: 400, // Ensure minimum height
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
  // Collapsible User List - Takes up remaining 1/4 space
  nearbyUsersList: {
    flex: 1, // Takes the remaining 1/4 of the space
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