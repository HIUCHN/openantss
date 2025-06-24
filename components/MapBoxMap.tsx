import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface MapBoxMapProps {
  userLocations: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    pinColor: string;
    statusText: string;
    image: string;
  }>;
  currentUserLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
  } | null;
  onUserPinPress: (user: any) => void;
  style?: any;
}

// Web MapBox implementation
const WebMapBox = ({ userLocations, currentUserLocation, onUserPinPress, style }: MapBoxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentUserMarker = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Get Mapbox access token from environment variables
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      console.error('❌ Mapbox access token not found. Please add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file');
      Alert.alert(
        'Map Configuration Error',
        'Mapbox access token is missing. Please contact support.'
      );
      return;
    }

    // Load MapBox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      initializeMap(mapboxToken);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Mapbox GL JS');
      Alert.alert('Map Error', 'Failed to load map. Please check your internet connection.');
    };
    document.head.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && userLocations.length > 0) {
      addUserMarkers();
    }
  }, [mapLoaded, userLocations]);

  useEffect(() => {
    if (mapLoaded && currentUserLocation) {
      updateCurrentUserLocation();
    }
  }, [mapLoaded, currentUserLocation]);

  const initializeMap = (accessToken: string) => {
    if (!mapContainer.current) return;

    try {
      // @ts-ignore - MapBox GL is loaded dynamically
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = accessToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-0.1276, 51.5074], // London coordinates as default
        zoom: 15,
        attributionControl: false,
      });

      map.current.on('load', () => {
        console.log('✅ Mapbox map loaded successfully');
        setMapLoaded(true);
        
        // Add geolocate control for user location tracking
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true,
        });
        
        map.current.addControl(geolocate, 'top-right');
        
        // Automatically trigger geolocation if no current user location
        if (!currentUserLocation) {
          geolocate.trigger();
        }
      });

      map.current.on('error', (e: any) => {
        console.error('❌ Mapbox error:', e);
        Alert.alert('Map Error', 'There was an error loading the map.');
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error('❌ Error initializing Mapbox:', error);
      Alert.alert('Map Error', 'Failed to initialize map.');
    }
  };

  const updateCurrentUserLocation = () => {
    if (!map.current || !currentUserLocation) return;

    try {
      // @ts-ignore
      const mapboxgl = window.mapboxgl;

      // Remove existing current user marker
      if (currentUserMarker.current) {
        currentUserMarker.current.remove();
      }

      // Create pulsing current user marker
      const currentUserElement = document.createElement('div');
      currentUserElement.style.width = '50px';
      currentUserElement.style.height = '50px';
      currentUserElement.style.borderRadius = '50%';
      currentUserElement.style.border = '4px solid white';
      currentUserElement.style.backgroundColor = '#6366F1';
      currentUserElement.style.boxShadow = '0 0 0 0 rgba(99, 102, 241, 0.7)';
      currentUserElement.style.animation = 'pulse 2s infinite';
      currentUserElement.style.cursor = 'default';
      currentUserElement.style.position = 'relative';
      currentUserElement.style.zIndex = '1000';
      
      // Add pulsing animation if not already added
      if (!document.getElementById('mapbox-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'mapbox-pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Create current user marker
      currentUserMarker.current = new mapboxgl.Marker(currentUserElement)
        .setLngLat([currentUserLocation.longitude, currentUserLocation.latitude])
        .addTo(map.current);

      // Center map on current user location
      map.current.flyTo({
        center: [currentUserLocation.longitude, currentUserLocation.latitude],
        zoom: 16,
        duration: 1000
      });

      console.log('✅ Current user location updated on map');
    } catch (error) {
      console.error('❌ Error updating current user location:', error);
    }
  };

  const addUserMarkers = () => {
    if (!map.current) return;

    try {
      // @ts-ignore
      const mapboxgl = window.mapboxgl;

      userLocations.forEach((user) => {
        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.style.width = '40px';
        markerElement.style.height = '40px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '3px solid white';
        markerElement.style.backgroundColor = user.pinColor;
        markerElement.style.backgroundImage = `url(${user.image})`;
        markerElement.style.backgroundSize = 'cover';
        markerElement.style.backgroundPosition = 'center';
        markerElement.style.cursor = 'pointer';
        markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        markerElement.style.transition = 'transform 0.2s ease';
        
        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.1)';
        });
        
        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
        });

        // Add click handler
        markerElement.addEventListener('click', () => {
          onUserPinPress(user);
        });

        // Create marker
        new mapboxgl.Marker(markerElement)
          .setLngLat([user.longitude, user.latitude])
          .addTo(map.current);
      });

      // Fit map to show all markers if no current user location
      if (userLocations.length > 0 && !currentUserLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        userLocations.forEach(user => {
          bounds.extend([user.longitude, user.latitude]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }

      console.log('✅ Added', userLocations.length, 'user markers to map');
    } catch (error) {
      console.error('❌ Error adding user markers:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      />
    </View>
  );
};

// Fallback component for mobile platforms
// NOTE: This is a placeholder implementation for native platforms.
// For a production-ready native map experience, you would need to:
// 1. Install react-native-maps: npm install react-native-maps
// 2. Configure platform-specific map providers (Google Maps for Android, Apple Maps for iOS)
// 3. Add native configuration files and permissions
// 4. Handle platform-specific map styling and features
// 
// Since this project uses Expo managed workflow and targets web primarily,
// we provide this fallback that shows user positions in a simplified view.
const FallbackMap = ({ userLocations, currentUserLocation, onUserPinPress, style }: MapBoxMapProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackMap}>
        <View style={styles.fallbackHeader}>
          <Text style={styles.fallbackTitle}>Nearby Users Map</Text>
          <Text style={styles.fallbackSubtitle}>
            {userLocations.length} user{userLocations.length !== 1 ? 's' : ''} nearby
          </Text>
        </View>
        
        {/* Current user location pin */}
        {currentUserLocation && (
          <View style={[styles.currentUserPin, { top: '50%', left: '50%' }]}>
            <View style={styles.currentUserPinInner} />
            <Text style={styles.pinLabel}>You</Text>
          </View>
        )}
        
        {/* Other user pins */}
        {userLocations.map((user, index) => (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.userPin,
              {
                top: `${30 + (index % 3) * 20}%`,
                left: `${30 + (index % 4) * 15}%`,
                backgroundColor: user.pinColor,
              }
            ]}
            onPress={() => onUserPinPress(user)}
            activeOpacity={0.7}
          >
            <View style={styles.pinImage}>
              <Text style={styles.pinInitial}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.pinLabel} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
        
        {userLocations.length === 0 && !currentUserLocation && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No users nearby</Text>
            <Text style={styles.emptyStateSubtext}>
              Enable Public Mode to see and be seen by other users
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function MapBoxMap(props: MapBoxMapProps) {
  // Use web implementation on web, fallback on mobile
  if (Platform.OS === 'web') {
    return <WebMapBox {...props} />;
  } else {
    return <FallbackMap {...props} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    borderRadius: 12,
    padding: 16,
  },
  fallbackHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    zIndex: 100,
  },
  fallbackTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  fallbackSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  currentUserPin: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  currentUserPinInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  userPin: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInitial: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#374151',
  },
  pinLabel: {
    position: 'absolute',
    top: 45,
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
    minWidth: 40,
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});