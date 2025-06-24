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
  const userMarkers = useRef<any[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Load MapBox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      initializeMap();
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

  const initializeMap = () => {
    if (!mapContainer.current) return;

    // @ts-ignore - MapBox GL is loaded dynamically
    const mapboxgl = window.mapboxgl;
    
    // Get access token from environment variable
    const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('❌ Mapbox access token not found. Please add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file');
      Alert.alert('Map Error', 'Mapbox access token not configured. Please contact support.');
      return;
    }
    
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
      
      // Automatically trigger geolocation
      geolocate.trigger();
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  const updateCurrentUserLocation = () => {
    if (!map.current || !currentUserLocation) return;

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
    currentUserElement.style.zIndex = '1000';
    
    // Add pulsing animation
    const style = document.createElement('style');
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

    console.log('✅ Current user location updated on map:', currentUserLocation);
  };

  const addUserMarkers = () => {
    if (!map.current) return;

    // @ts-ignore
    const mapboxgl = window.mapboxgl;

    // Remove existing user markers
    userMarkers.current.forEach(marker => marker.remove());
    userMarkers.current = [];

    console.log('📍 Adding', userLocations.length, 'user markers to map');

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
      markerElement.style.zIndex = '999';

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.1)';
        markerElement.style.transition = 'transform 0.2s ease';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Add click handler
      markerElement.addEventListener('click', () => {
        console.log('📍 User marker clicked:', user.name);
        onUserPinPress(user);
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current);

      userMarkers.current.push(marker);

      console.log('📍 Added marker for user:', user.name, 'at', user.latitude, user.longitude);
    });

    // Fit map to show all markers if we have user locations
    if (userLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add current user location to bounds if available
      if (currentUserLocation) {
        bounds.extend([currentUserLocation.longitude, currentUserLocation.latitude]);
      }
      
      // Add all user locations to bounds
      userLocations.forEach(user => {
        bounds.extend([user.longitude, user.latitude]);
      });
      
      // Only fit bounds if we have multiple points
      if (userLocations.length > 1 || (userLocations.length > 0 && currentUserLocation)) {
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 16 // Don't zoom in too much
        });
      }
    }

    console.log('✅ All user markers added successfully');
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

// Enhanced fallback component for mobile with better user location display
const FallbackMap = ({ userLocations, currentUserLocation, onUserPinPress, style }: MapBoxMapProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackMap}>
        {/* Current user location pin */}
        {currentUserLocation && (
          <View style={[styles.currentUserPin, { top: '50%', left: '50%' }]}>
            <View style={styles.currentUserPinInner} />
          </View>
        )}
        
        {/* Other user pins - distributed around the map */}
        {userLocations.map((user, index) => {
          // Calculate position based on relative distance from current user
          let top = '50%';
          let left = '50%';
          
          if (currentUserLocation) {
            // Simple positioning based on lat/lng difference
            const latDiff = user.latitude - currentUserLocation.latitude;
            const lngDiff = user.longitude - currentUserLocation.longitude;
            
            // Convert to percentage positions (simplified)
            const topPercent = Math.max(10, Math.min(90, 50 - (latDiff * 1000)));
            const leftPercent = Math.max(10, Math.min(90, 50 + (lngDiff * 1000)));
            
            top = `${topPercent}%`;
            left = `${leftPercent}%`;
          } else {
            // Fallback to distributed positioning
            top = `${30 + (index * 15) % 40}%`;
            left = `${40 + (index * 10) % 20}%`;
          }
          
          return (
            <View
              key={user.id}
              style={[
                styles.userPin,
                {
                  top,
                  left,
                  backgroundColor: user.pinColor,
                }
              ]}
              onTouchEnd={() => onUserPinPress(user)}
            >
              <View style={styles.pinImage}>
                {/* Placeholder for user image */}
                <View style={styles.pinImagePlaceholder} />
              </View>
            </View>
          );
        })}
        
        {/* Map info overlay */}
        <View style={styles.mapInfoOverlay}>
          <View style={styles.mapInfoCard}>
            <Text style={styles.mapInfoText}>
              {userLocations.length} nearby user{userLocations.length !== 1 ? 's' : ''}
            </Text>
            {currentUserLocation && (
              <Text style={styles.mapInfoSubtext}>
                Your location: {currentUserLocation.latitude.toFixed(4)}, {currentUserLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default function MapBoxMap(props: MapBoxMapProps) {
  // Use web implementation on web, enhanced fallback on mobile
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
    zIndex: 1000,
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
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 999,
  },
  pinImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pinImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D1D5DB',
  },
  mapInfoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  mapInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 4,
  },
  mapInfoSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});