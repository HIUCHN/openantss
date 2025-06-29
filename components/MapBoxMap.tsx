import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Alert, Dimensions, Text } from 'react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface MapBoxMapProps {
  userLocations: Array<{
    id: string;
    name: string;
    role: string;
    company: string;
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
  showUserInfo?: boolean;
}

// Web MapBox implementation
const WebMapBox = ({ userLocations, currentUserLocation, onUserPinPress, style, showUserInfo = false }: MapBoxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentUserMarker = useRef<any>(null);
  const userMarkers = useRef<any[]>([]);
  const userPopups = useRef<any[]>([]);

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
    if (mapLoaded) {
      // Clear existing markers when userLocations change
      clearUserMarkers();
      
      if (userLocations.length > 0) {
        addUserMarkers();
      }
    }
  }, [mapLoaded, userLocations, showUserInfo]);

  useEffect(() => {
    if (mapLoaded && currentUserLocation) {
      updateCurrentUserLocation();
    }
  }, [mapLoaded, currentUserLocation]);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    // @ts-ignore - MapBox GL is loaded dynamically
    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGl1Y2hhbiIsImEiOiJjbWJzZ3JnMzUwaWxzMmlxdXVsZXkxcG1jIn0.cruZNFJhtA4rM45hlzjsyA';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Changed from light-v11 to streets-v12
      center: [-0.1276, 51.5074], // London coordinates
      zoom: 15,
      attributionControl: false,
    });

    map.current.on('load', () => {
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

  const clearUserMarkers = () => {
    // Remove all existing user markers
    userMarkers.current.forEach(marker => marker.remove());
    userMarkers.current = [];
    
    // Remove all existing popups
    userPopups.current.forEach(popup => popup.remove());
    userPopups.current = [];
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
  };

  const addUserMarkers = () => {
    if (!map.current) return;

    // @ts-ignore
    const mapboxgl = window.mapboxgl;

    console.log('🗺️ Adding markers for', userLocations.length, 'users');

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

      // Add click handler
      markerElement.addEventListener('click', () => {
        onUserPinPress(user);
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current);
      
      // Store marker reference for later removal
      userMarkers.current.push(marker);
      
      // Add user info label above marker
      const labelElement = document.createElement('div');
      labelElement.className = 'mapboxgl-user-label';
      labelElement.style.backgroundColor = 'white';
      labelElement.style.padding = '4px 8px';
      labelElement.style.borderRadius = '4px';
      labelElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      labelElement.style.fontSize = '12px';
      labelElement.style.fontWeight = 'bold';
      labelElement.style.textAlign = 'center';
      labelElement.style.minWidth = '100px';
      labelElement.style.pointerEvents = 'none';
      labelElement.style.transform = 'translate(-50%, -120%)';
      labelElement.style.position = 'relative';
      labelElement.style.zIndex = '1';
      
      // Add user name
      const nameElement = document.createElement('div');
      nameElement.textContent = user.name;
      nameElement.style.fontWeight = 'bold';
      nameElement.style.color = '#111827';
      labelElement.appendChild(nameElement);
      
      // Add user role and company
      const roleElement = document.createElement('div');
      roleElement.textContent = `${user.role} at ${user.company}`;
      roleElement.style.fontSize = '10px';
      roleElement.style.color = '#6B7280';
      labelElement.appendChild(roleElement);
      
      // Create a popup for the label
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: [0, -20],
        className: 'mapboxgl-user-label-popup'
      })
      .setLngLat([user.longitude, user.latitude])
      .setDOMContent(labelElement)
      .addTo(map.current);
      
      // Store popup reference for later removal
      userPopups.current.push(popup);
      
      console.log('📍 Added marker for user:', user.name, 'at', user.latitude, user.longitude);
    });

    // Add custom CSS for the popups
    const popupStyle = document.createElement('style');
    popupStyle.textContent = `
      .mapboxgl-user-label-popup .mapboxgl-popup-content {
        padding: 4px 8px;
        border-radius: 4px;
      }
      .mapboxgl-user-label-popup .mapboxgl-popup-tip {
        display: none;
      }
    `;
    document.head.appendChild(popupStyle);

    // Fit map to show all markers if no current user location
    if (userLocations.length > 0 && !currentUserLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      userLocations.forEach(user => {
        bounds.extend([user.longitude, user.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
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

// Fallback component for mobile (shows static map with overlays)
const FallbackMap = ({ userLocations, currentUserLocation, onUserPinPress, style, showUserInfo = false }: MapBoxMapProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackMap}>
        {/* Current user location pin */}
        {currentUserLocation && (
          <View style={[styles.currentUserPin, { top: '50%', left: '50%' }]}>
            <View style={styles.currentUserPinInner} />
          </View>
        )}
        
        {/* Other user pins */}
        {userLocations.map((user, index) => (
          <View
            key={user.id}
            style={[
              styles.userPin,
              {
                top: `${30 + index * 15}%`,
                left: `${40 + index * 10}%`,
                backgroundColor: user.pinColor,
              }
            ]}
            onTouchEnd={() => onUserPinPress(user)}
          >
            <View style={styles.pinImage}>
              {/* Placeholder for user image */}
            </View>
            
            {/* User info label */}
            {showUserInfo && (
              <View style={styles.userInfoLabel}>
                <Text style={styles.userInfoName}>{user.name}</Text>
                <Text style={styles.userInfoRole}>{user.role} at {user.company}</Text>
              </View>
            )}
          </View>
        ))}
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
    zIndex: 1,
  },
  pinImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  userInfoLabel: {
    position: 'absolute',
    top: -45,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  userInfoName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    textAlign: 'center',
  },
  userInfoRole: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});