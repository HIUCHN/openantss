import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MapPin, Play, Square, RefreshCw } from 'lucide-react-native';
import { useLocationTracking } from '@/hooks/useLocationTracking';

interface LocationTrackerProps {
  autoStart?: boolean;
  showControls?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

export default function LocationTracker({ 
  autoStart = true, 
  showControls = false,
  onLocationUpdate 
}: LocationTrackerProps) {
  const {
    currentLocation,
    isTracking,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  } = useLocationTracking({ autoStart });

  // Notify parent component of location updates
  useEffect(() => {
    if (currentLocation && onLocationUpdate) {
      onLocationUpdate({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, onLocationUpdate]);

  const handleStartTracking = async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return;
    }
    await startTracking();
  };

  const handleGetCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      Alert.alert(
        'Current Location',
        `Latitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ${Math.round(location.accuracy)}m`
      );
    }
  };

  if (!showControls && !error) {
    // Silent tracking mode - no UI
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isTracking ? '#10B981' : hasPermission ? '#F59E0B' : '#EF4444' }
        ]} />
        <Text style={styles.statusText}>
          {isTracking ? 'Tracking Active' : hasPermission ? 'Ready to Track' : 'Permission Required'}
        </Text>
      </View>

      {/* Location Info */}
      {currentLocation && (
        <View style={styles.locationInfo}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.locationText}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.accuracyText}>
            ±{Math.round(currentLocation.accuracy)}m
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {!isTracking ? (
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartTracking}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopTracking}
            >
              <Square size={16} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleGetCurrentLocation}
          >
            <RefreshCw size={16} color="#6366F1" />
            <Text style={styles.refreshButtonText}>Get Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  accuracyText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  refreshButton: {
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
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
});