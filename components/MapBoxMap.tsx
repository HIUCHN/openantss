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
    if (mapLoaded) {
      // Clear existing markers when userLocations change
      clearUserMarkers();
      
      if (userLocations.length > 0) {
        addUserMarkers();
      }
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
      // Create marker container
      const markerContainer = document.createElement('div');
      markerContainer.style.position = 'relative';
      
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
      markerElement.style.zIndex = '1';
      
      // Create info card element
      const infoCard = document.createElement('div');
      infoCard.style.position = 'absolute';
      infoCard.style.bottom = '45px';
      infoCard.style.left = '50%';
      infoCard.style.transform = 'translateX(-50%)';
      infoCard.style.backgroundColor = 'white';
      infoCard.style.borderRadius = '8px';
      infoCard.style.padding = '8px 12px';
      infoCard.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      infoCard.style.whiteSpace = 'nowrap';
      infoCard.style.zIndex = '2';
      infoCard.style.minWidth = '120px';
      infoCard.style.textAlign = 'center';
      
      // Create pointer triangle
      const pointer = document.createElement('div');
      pointer.style.position = 'absolute';
      pointer.style.bottom = '-5px';
      pointer.style.left = '50%';
      pointer.style.transform = 'translateX(-50%)';
      pointer.style.width = '10px';
      pointer.style.height = '10px';
      pointer.style.backgroundColor = 'white';
      pointer.style.transform = 'translateX(-50%) rotate(45deg)';
      pointer.style.zIndex = '1';
      
      // Create name element
      const nameElement = document.createElement('div');
      nameElement.textContent = user.name;
      nameElement.style.fontWeight = 'bold';
      nameElement.style.fontSize = '14px';
      nameElement.style.color = '#111827';
      nameElement.style.marginBottom = '2px';
      
      // Create role element
      const roleElement = document.createElement('div');
      roleElement.textContent = user.role;
      roleElement.style.fontSize = '12px';
      roleElement.style.color = '#6B7280';
      
      // Create company element
      const companyElement = document.createElement('div');
      companyElement.textContent = `at ${user.company}`;
      companyElement.style.fontSize = '12px';
      companyElement.style.color = '#6B7280';
      companyElement.style.fontStyle = 'italic';
      
      // Append elements to info card
      infoCard.appendChild(nameElement);
      infoCard.appendChild(roleElement);
      infoCard.appendChild(companyElement);
      infoCard.appendChild(pointer);
      
      // Append marker and info card to container
      markerContainer.appendChild(infoCard);
      markerContainer.appendChild(markerElement);

      // Add click handler
      markerElement.addEventListener('click', () => {
        onUserPinPress(user);
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerContainer)
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current);
      
      // Store marker reference for later removal
      userMarkers.current.push(marker);
      
      console.log('📍 Added marker for user:', user.name, 'at', user.latitude, user.longitude);
    });

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
        
        {/* Other user pins */}
        {userLocations.map((user, index) => (
          <View
            key={user.id}
            style={[
              styles.userPinContainer,
              {
                top: `${30 + index * 15}%`,
                left: `${40 + index * 10}%`,
              }
            ]}
          >
            {/* User info card */}
            <View style={styles.userInfoCard}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              <Text style={styles.userCompany}>at {user.company}</Text>
              <View style={styles.cardPointer} />
            </View>
            
            {/* User pin */}
            <View
              style={[
                styles.userPin,
                { backgroundColor: user.pinColor }
              ]}
              onTouchEnd={() => onUserPinPress(user)}
            >
              <View style={styles.pinImage}>
                {/* Placeholder for user image */}
              </View>
            </View>
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
  userPinContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    minWidth: 120,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  userCompany: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardPointer: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  userPin: {
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
  },
});