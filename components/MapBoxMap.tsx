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
  const accuracyCircle = useRef<any>(null);
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
      
      // Add compass control
      const nav = new mapboxgl.NavigationControl({
        visualizePitch: true
      });
      map.current.addControl(nav, 'top-right');
      
      // Add scale control
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      });
      map.current.addControl(scale, 'bottom-left');
      
      // Add custom layer for accuracy circle
      map.current.addSource('accuracy-circle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
            radius: 0
          }
        }
      });
      
      map.current.addLayer({
        id: 'accuracy-circle-fill',
        type: 'circle',
        source: 'accuracy-circle',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': 'rgba(99, 102, 241, 0.1)',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(99, 102, 241, 0.5)'
        }
      });
    });
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
    currentUserElement.className = 'current-user-marker';
    currentUserElement.style.width = '24px';
    currentUserElement.style.height = '24px';
    currentUserElement.style.borderRadius = '50%';
    currentUserElement.style.border = '3px solid white';
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
          transform: scale(0.95);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
          transform: scale(1);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
          transform: scale(0.95);
        }
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .heading-indicator {
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 16px solid #6366F1;
        animation: rotate 2s linear infinite;
        transform-origin: bottom center;
      }
    `;
    document.head.appendChild(style);
    
    // Add heading indicator if available
    if (currentUserLocation.heading) {
      const headingIndicator = document.createElement('div');
      headingIndicator.className = 'heading-indicator';
      currentUserElement.appendChild(headingIndicator);
    }

    // Create current user marker
    currentUserMarker.current = new mapboxgl.Marker(currentUserElement)
      .setLngLat([currentUserLocation.longitude, currentUserLocation.latitude])
      .addTo(map.current);

    // Add "You" label above current user marker
    const youPopupContent = document.createElement('div');
    youPopupContent.className = 'current-user-label';
    youPopupContent.style.padding = '4px 8px';
    youPopupContent.style.backgroundColor = '#6366F1';
    youPopupContent.style.color = '#FFFFFF';
    youPopupContent.style.borderRadius = '12px';
    youPopupContent.style.fontWeight = 'bold';
    youPopupContent.style.fontSize = '12px';
    youPopupContent.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    youPopupContent.style.textAlign = 'center';
    youPopupContent.style.minWidth = '40px';
    youPopupContent.textContent = 'You';

    const youPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -20],
      className: 'current-user-popup'
    })
    .setLngLat([currentUserLocation.longitude, currentUserLocation.latitude])
    .setDOMContent(youPopupContent)
    .addTo(map.current);

    // Update accuracy circle if accuracy is available
    if (currentUserLocation.accuracy) {
      // Update the accuracy circle source
      map.current.getSource('accuracy-circle').setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [currentUserLocation.longitude, currentUserLocation.latitude]
        },
        properties: {
          radius: metersToPixelsAtMaxZoom(currentUserLocation.accuracy, currentUserLocation.latitude)
        }
      });
    }

    // Center map on current user location with smooth animation
    map.current.flyTo({
      center: [currentUserLocation.longitude, currentUserLocation.latitude],
      zoom: 16,
      duration: 1000,
      essential: true // This animation is considered essential for the user experience
    });
  };

  // Convert meters to pixels at max zoom level
  const metersToPixelsAtMaxZoom = (meters: number, latitude: number) => {
    // Earth's circumference at the equator is about 40,075,000 meters
    const earthCircumference = 40075000;
    // At zoom level 22, the map is 2^22 = 4,194,304 pixels wide
    const mapWidth = 4194304;
    // Calculate the number of meters per pixel at the equator
    const metersPerPixel = earthCircumference / mapWidth;
    // Adjust for latitude (maps get distorted as you move away from the equator)
    const pixelsPerMeter = 1 / (metersPerPixel * Math.cos(latitude * Math.PI / 180));
    return meters * pixelsPerMeter;
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
      
      // Add popup with user info
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'user-info-popup';
      popupContent.style.padding = '0';
      popupContent.style.borderRadius = '8px';
      popupContent.style.overflow = 'hidden';
      popupContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      popupContent.style.minWidth = '180px';
      popupContent.style.textAlign = 'center';
      
      // Create info container
      const infoContainer = document.createElement('div');
      infoContainer.style.backgroundColor = user.pinColor;
      infoContainer.style.color = '#FFFFFF';
      infoContainer.style.padding = '8px 12px';
      infoContainer.style.borderRadius = '8px';
      
      // Add user name
      const nameElement = document.createElement('div');
      nameElement.textContent = user.name;
      nameElement.style.fontWeight = 'bold';
      nameElement.style.fontSize = '14px';
      nameElement.style.marginBottom = '2px';
      infoContainer.appendChild(nameElement);
      
      // Add user role and company
      const roleElement = document.createElement('div');
      roleElement.textContent = `${user.role} at ${user.company}`;
      roleElement.style.fontSize = '12px';
      roleElement.style.opacity = '0.9';
      infoContainer.appendChild(roleElement);
      
      popupContent.appendChild(infoContainer);
      
      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -20],
        className: 'user-info-popup'
      })
      .setLngLat([user.longitude, user.latitude])
      .setDOMContent(popupContent)
      .addTo(map.current);
      
      // Store popup reference for later removal
      userPopups.current.push(popup);
      
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
const FallbackMap = ({ userLocations, currentUserLocation, onUserPinPress, style, showUserInfo = false }: MapBoxMapProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackMap}>
        {/* Current user location pin */}
        {currentUserLocation && (
          <View style={[styles.currentUserPin, { top: '50%', left: '50%' }]}>
            <View style={styles.currentUserPinInner} />
            <View style={styles.currentUserLabel}>
              <Text style={styles.currentUserLabelText}>You</Text>
            </View>
            {currentUserLocation.accuracy && (
              <View style={[styles.accuracyCircle, { width: 100, height: 100 }]} />
            )}
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
            <View style={styles.userInfoLabel}>
              <Text style={styles.userInfoName}>{user.name}</Text>
              <Text style={styles.userInfoRole}>{user.role} at {user.company}</Text>
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 10,
  },
  currentUserPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  currentUserLabel: {
    position: 'absolute',
    top: -30,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentUserLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 5,
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
    top: -60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  userInfoName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  userInfoRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});