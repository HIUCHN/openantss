import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  distanceFilter?: number;
  timeInterval?: number;
  autoStart?: boolean;
}

export function useLocationTracking(options: LocationTrackingOptions = {}) {
  const {
    enableHighAccuracy = true,
    distanceFilter = 10, // meters
    timeInterval = 30000, // 30 seconds
    autoStart = true
  } = options;

  const { updateUserLocation } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  // Request location permissions
  const requestPermissions = async () => {
    try {
      console.log('📍 Requesting location permissions...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        setError('Location permission denied. Please enable location access in settings.');
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby professionals and update your location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return false;
      }

      console.log('✅ Location permission granted');
      setError(null);
      return true;
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    }
  };

  // Get current location once
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      console.log('📍 Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        maximumAge: 60000, // 1 minute
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      setCurrentLocation(locationData);
      console.log('✅ Current location obtained:', locationData);

      // Update in backend
      await updateUserLocation(locationData.latitude, locationData.longitude);

      return locationData;
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      setError('Failed to get current location');
      return null;
    }
  };

  // Start continuous location tracking
  const startTracking = async () => {
    try {
      if (isTracking) {
        console.log('⚠️ Location tracking already active');
        return;
      }

      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      console.log('🎯 Starting location tracking...');
      setIsTracking(true);
      setError(null);

      // Get initial location
      await getCurrentLocation();

      // Start watching position
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          timeInterval,
          distanceInterval: distanceFilter,
        },
        async (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };

          console.log('📍 Location updated:', locationData);
          setCurrentLocation(locationData);

          // Update in backend
          try {
            await updateUserLocation(locationData.latitude, locationData.longitude);
            console.log('✅ Location sent to backend successfully');
          } catch (error) {
            console.error('❌ Failed to update location in backend:', error);
          }
        }
      );

      watcherRef.current = watcher;
      console.log('✅ Location tracking started successfully');
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      setError('Failed to start location tracking');
      setIsTracking(false);
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watcherRef.current) {
      console.log('🛑 Stopping location tracking...');
      watcherRef.current.remove();
      watcherRef.current = null;
      setIsTracking(false);
      console.log('✅ Location tracking stopped');
    }
  };

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [autoStart]);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    
    checkPermissions();
  }, []);

  return {
    currentLocation,
    isTracking,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  };
}