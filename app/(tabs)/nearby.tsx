import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Modal, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Users, 
  Briefcase, 
  Calendar, 
  MessageCircle, 
  UserPlus, 
  Filter, 
  Bell,
  List,
  Map,
  Lightbulb,
  Hand,
  Bookmark,
  Coffee,
  Plus,
  Minus,
  Crosshair,
  ArrowLeft,
  X,
  Eye,
  EyeOff
} from 'lucide-react-native';
import * as Location from 'expo-location';
import SearchBar from '@/components/SearchBar';
import OpenAntsLogo from '@/components/OpenAntsLogo';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import MapBoxMap from '@/components/MapBoxMap';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const nearbyPeople = [
  {
    id: 1,
    name: 'Alex Chen',
    role: 'Senior Product Designer',
    company: 'Spotify',
    education: 'MSc, University of Edinburgh',
    distance: '15m away',
    location: 'Same café',
    bio: 'Passionate about creating user-centered experiences. Love mentoring junior designers and exploring new design systems.',
    interests: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'available',
    lookingFor: 'Looking for mentorship in design leadership',
    isOnline: true,
    latitude: 51.5074,
    longitude: -0.1278,
    pinColor: '#10B981',
    statusText: 'Open to chat',
    lastActive: '2 mins ago',
    tags: ['#ProductStrategy', '#Design', '#Leadership']
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Frontend Developer',
    company: 'Airbnb',
    education: 'BSc Computer Science, MIT',
    distance: '8m away',
    location: 'Same building',
    bio: 'Full-stack developer passionate about React and modern web technologies. Always excited to collaborate on innovative projects.',
    interests: ['React', 'Hiring', 'Mutual: #Frontend'],
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'available',
    lookingFor: null,
    isOnline: true,
    latitude: 51.5084,
    longitude: -0.1268,
    pinColor: '#3B82F6',
    statusText: 'Manager at Adobe',
    lastActive: '5 mins ago',
    tags: ['#Figma', '#Startups', '#Mentoring']
  },
  {
    id: 3,
    name: 'Mike Johnson',
    role: 'Product Manager',
    company: 'Tesla',
    education: 'MBA, Stanford',
    distance: '12m away',
    location: 'Coffee shop',
    bio: 'Product strategist with experience in automotive tech. Love discussing innovation and future mobility.',
    interests: ['Product Strategy', 'Innovation', 'Startups'],
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'student',
    lookingFor: 'Looking for internship opportunities',
    isOnline: true,
    latitude: 51.5064,
    longitude: -0.1288,
    pinColor: '#F59E0B',
    statusText: 'MSc Student at UCL',
    lastActive: '1 min ago',
    tags: ['#MachineLearning', '#Python', '#Research']
  },
];

const crossedPaths = [
  {
    id: 1,
    name: 'Mike',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    timeAgo: '2h ago',
  },
  {
    id: 2,
    name: 'Lisa',
    image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
    timeAgo: '5h ago',
  },
  {
    id: 3,
    name: 'David',
    image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
    timeAgo: '1d ago',
  },
];

const nearbyEvents = [
  {
    id: 1,
    title: 'React Meetup',
    location: 'Tech Hub',
    time: 'Tomorrow 7:00 PM',
    attendees: 15,
    type: 'meetup',
  },
];

const quickFilters = ['All', 'Within 100m', 'Open to Chat', 'Mentoring', 'Freelance'];

export default function NearbyScreen() {
  const { storeUserLocation, getNearbyUsers, profile, user } = useAuth();
  const [isPublicMode, setIsPublicMode] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [openToChat, setOpenToChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPeople, setFilteredPeople] = useState(nearbyPeople);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loadingNearbyUsers, setLoadingNearbyUsers] = useState(false);
  
  // Enhanced location tracking state
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]); // For filtering
  const [isLocationStable, setIsLocationStable] = useState(false);

  useEffect(() => {
    // Pulse animation for user's location pin
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Request location permissions and start tracking - only when user is authenticated
  useEffect(() => {
    // Only start location tracking if user is authenticated
    if (user) {
      requestLocationPermission();
    }
    
    // Cleanup location watcher on unmount
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, [user]); // Add user as dependency

  // Auto-refresh nearby users when location changes - only when user is authenticated
  useEffect(() => {
    if (autoRefresh && currentUserLocation && user && isLocationStable) {
      fetchNearbyUsers();
    }
  }, [currentUserLocation, autoRefresh, user, isLocationStable]); // Add user as dependency

  const requestLocationPermission = async () => {
    try {
      console.log('📍 Requesting location permissions...');
      
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'To show your location on the map and find nearby professionals, please enable location access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      console.log('✅ Location permission granted, starting location tracking...');
      startLocationTracking();
      
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  // Enhanced location filtering function
  const filterLocation = (newLocation) => {
    const { latitude, longitude, accuracy } = newLocation;
    
    // Reject locations with very poor accuracy (> 100 meters)
    if (accuracy > 100) {
      console.log('🚫 Rejecting location with poor accuracy:', accuracy);
      return null;
    }
    
    // If we have location history, apply smoothing
    if (locationHistory.length > 0) {
      const lastLocation = locationHistory[locationHistory.length - 1];
      
      // Calculate distance from last known good location
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        latitude,
        longitude
      );
      
      // Reject locations that are too far from the last known position
      // (likely GPS errors causing jumps)
      if (distance > 200) { // 200 meters threshold
        console.log('🚫 Rejecting location jump of', distance, 'meters');
        return null;
      }
      
      // Apply weighted average for smoothing (reduce jitter)
      if (locationHistory.length >= 3) {
        const recentLocations = locationHistory.slice(-3);
        const avgLat = recentLocations.reduce((sum, loc) => sum + loc.latitude, 0) / recentLocations.length;
        const avgLng = recentLocations.reduce((sum, loc) => sum + loc.longitude, 0) / recentLocations.length;
        
        // Blend current location with recent average (70% current, 30% average)
        const smoothedLat = latitude * 0.7 + avgLat * 0.3;
        const smoothedLng = longitude * 0.7 + avgLng * 0.3;
        
        return {
          ...newLocation,
          latitude: smoothedLat,
          longitude: smoothedLng,
        };
      }
    }
    
    return newLocation;
  };

  const startLocationTracking = async () => {
    try {
      // Get initial location with high accuracy
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
        maximumAge: 10000, // Accept cached location up to 10 seconds old
        timeout: 15000, // 15 second timeout
      });

      const initialCoords = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        accuracy: initialLocation.coords.accuracy,
        timestamp: new Date(initialLocation.timestamp),
      };

      // Apply filtering to initial location
      const filteredInitialCoords = filterLocation(initialCoords);
      
      if (filteredInitialCoords) {
        setCurrentUserLocation(filteredInitialCoords);
        setLocationHistory([filteredInitialCoords]);
        console.log('📍 Initial location obtained:', filteredInitialCoords);

        // Store location in database - only if user is authenticated
        if (user) {
          await storeUserLocation({
            latitude: filteredInitialCoords.latitude,
            longitude: filteredInitialCoords.longitude,
            accuracy: filteredInitialCoords.accuracy,
            timestamp: filteredInitialCoords.timestamp,
          });
        }
      }

      // Start watching position for real-time updates with enhanced settings
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
          timeInterval: 10000, // Update every 10 seconds (more frequent)
          distanceInterval: 10, // Update when moved 10 meters (more sensitive)
          mayShowUserSettingsDialog: true, // Allow showing settings dialog
        },
        async (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp),
          };
          
          // Apply filtering to new location
          const filteredCoords = filterLocation(newCoords);
          
          if (filteredCoords) {
            setCurrentUserLocation(filteredCoords);
            
            // Update location history (keep last 10 locations)
            setLocationHistory(prev => {
              const updated = [...prev, filteredCoords];
              return updated.slice(-10);
            });
            
            // Mark location as stable after we have enough history
            if (locationHistory.length >= 3) {
              setIsLocationStable(true);
            }
            
            console.log('📍 Location updated (filtered):', filteredCoords);

            // Store updated location in database - only if user is authenticated
            if (user) {
              await storeUserLocation({
                latitude: filteredCoords.latitude,
                longitude: filteredCoords.longitude,
                accuracy: filteredCoords.accuracy,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: filteredCoords.timestamp,
              });
            }
          } else {
            console.log('📍 Location filtered out due to poor quality');
          }
        }
      );

      setLocationWatcher(watcher);
      console.log('✅ Enhanced location tracking started');
      
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      Alert.alert('Location Error', 'Failed to get your current location. Please check your location settings and try again.');
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      setLoadingNearbyUsers(true);
      console.log('🔍 Fetching nearby users...');
      
      // Only fetch if user is authenticated and location is available
      if (!user || !currentUserLocation) {
        console.log('❌ Cannot fetch nearby users: user not authenticated or location not available');
        return;
      }
      
      const { data, error } = await getNearbyUsers(1000); // 1km radius
      
      if (error) {
        console.error('❌ Error fetching nearby users:', error);
      } else {
        console.log('✅ Nearby users fetched:', data?.length || 0);
        setNearbyUsers(data || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching nearby users:', error);
    } finally {
      setLoadingNearbyUsers(false);
    }
  };

  // Helper function to calculate distance between two points
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

    return R * c; // Distance in meters
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredPeople(nearbyPeople);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const results = nearbyPeople.filter(person => 
      person.name.toLowerCase().includes(lowercaseQuery) ||
      person.role.toLowerCase().includes(lowercaseQuery) ||
      person.company.toLowerCase().includes(lowercaseQuery) ||
      person.bio.toLowerCase().includes(lowercaseQuery) ||
      person.interests.some(interest => interest.toLowerCase().includes(lowercaseQuery)) ||
      person.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (person.lookingFor && person.lookingFor.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredPeople(results);
  };

  const handleUserPinPress = (user) => {
    setSelectedUser(user);
    setShowUserPopup(true);
  };

  const closeUserPopup = () => {
    setShowUserPopup(false);
    setSelectedUser(null);
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  // Convert nearby people to map format
  const mapUserLocations = filteredPeople.map(person => ({
    id: person.id.toString(),
    name: person.name,
    latitude: person.latitude,
    longitude: person.longitude,
    pinColor: person.pinColor,
    statusText: person.statusText,
    image: person.image,
    ...person // Include all other properties
  }));

  const PersonCard = ({ person }) => (
    <View style={styles.personCard}>
      <View style={styles.personHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: person.image }} style={styles.personImage} />
          {person.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.personInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.personName}>{person.name}</Text>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{person.distance} • {person.location}</Text>
            </View>
          </View>
          <Text style={styles.personRole}>{person.role} at {person.company}</Text>
          <Text style={styles.personEducation}>{person.education}</Text>
          <Text style={styles.personBio}>{person.bio}</Text>
          
          <View style={styles.interestsContainer}>
            {person.interests.map((interest, index) => (
              <View 
                key={index} 
                style={[
                  styles.interestTag,
                  index === 0 ? styles.interestTagBlue :
                  index === 1 ? styles.interestTagGreen :
                  index === 2 ? styles.interestTagPurple :
                  styles.interestTagOrange
                ]}
              >
                <Text 
                  style={[
                    styles.interestText,
                    index === 0 ? styles.interestTextBlue :
                    index === 1 ? styles.interestTextGreen :
                    index === 2 ? styles.interestTextPurple :
                    styles.interestTextOrange
                  ]}
                >
                  {interest}
                </Text>
              </View>
            ))}
          </View>
          
          {person.lookingFor && (
            <View style={styles.lookingForContainer}>
              <Lightbulb size={14} color="#F59E0B" />
              <Text style={styles.lookingForText}>{person.lookingFor}</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <MessageCircle size={14} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Hand size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Bookmark size={14} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Calendar size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const CrossedPathsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>People You Crossed Paths With</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.crossedPathsContainer}>
        {crossedPaths.map((person) => (
          <TouchableOpacity key={person.id} style={styles.crossedPathItem}>
            <Image source={{ uri: person.image }} style={styles.crossedPathImage} />
            <Text style={styles.crossedPathName}>{person.name}</Text>
            <Text style={styles.crossedPathTime}>{person.timeAgo}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const EventCard = ({ event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIcon}>
          <Calendar size={16} color="#6366F1" />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDetails}>{event.time} • {event.location}</Text>
          <Text style={styles.eventAttendees}>{event.attendees} attendees interested</Text>
        </View>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const UserPopupModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={showUserPopup}
        transparent={true}
        animationType="slide"
        onRequestClose={closeUserPopup}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeUserPopup}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            
            <View style={styles.popupContent}>
              <View style={styles.popupHeader}>
                <Image source={{ uri: selectedUser.image }} style={styles.popupAvatar} />
                <View style={styles.popupUserInfo}>
                  <Text style={styles.popupUserName}>{selectedUser.name}</Text>
                  <Text style={styles.popupUserTitle}>{selectedUser.role} at {selectedUser.company}</Text>
                  <Text style={styles.popupUserDistance}>{selectedUser.distance} – {selectedUser.location}</Text>
                  <Text style={styles.popupUserStatus}>
                    {selectedUser.statusText} • Active {selectedUser.lastActive}
                  </Text>
                </View>
              </View>
              
              <View style={styles.popupTags}>
                {selectedUser.tags.map((tag, index) => (
                  <View key={index} style={styles.popupTag}>
                    <Text style={styles.popupTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.popupActions}>
                <TouchableOpacity style={styles.popupPrimaryButton}>
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text style={styles.popupPrimaryButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupSecondaryButton}>
                  <Hand size={16} color="#6B7280" />
                  <Text style={styles.popupSecondaryButtonText}>Wave</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.popupSecondaryButton}>
                  <Text style={styles.popupSecondaryButtonText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {viewMode === 'map' && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setViewMode('list')}
              >
                <ArrowLeft size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <View style={styles.appIcon}>
              <OpenAntsLogo size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>OpenAnts</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.profileImage} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar - Only show in list view */}
      {viewMode === 'list' && (
        <SearchBar
          placeholder="Search people, skills, companies..."
          onSearch={handleSearch}
          showFilter={true}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      {/* Notification Banner - Only show in map view */}
      {viewMode === 'map' && showNotificationBanner && (
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.notificationBanner}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationIcon}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>
                {loadingNearbyUsers ? 'Finding nearby professionals...' : `${nearbyUsers.length} professionals near you are open to connect right now!`}
              </Text>
              <Text style={styles.notificationSubtitle}>
                {currentUserLocation 
                  ? `High accuracy GPS active • ${Math.round(currentUserLocation.accuracy)}m precision`
                  : 'Enable location to find nearby professionals'
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationClose}
              onPress={() => setShowNotificationBanner(false)}
            >
              <X size={16} color="#FFFFFF80" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* Status Panel - Only show in map view */}
      {viewMode === 'map' && (
        <View style={styles.statusPanel}>
          <View style={styles.statusContent}>
            <View style={styles.statusLeft}>
              <View style={styles.statusIcon}>
                <Eye size={14} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.statusTitle}>
                  You and {nearbyUsers.length} others are visible
                </Text>
                <Text style={styles.statusSubtitle}>
                  {currentUserLocation 
                    ? `Enhanced GPS tracking • ${isLocationStable ? 'Stable' : 'Stabilizing'} • ${Math.round(currentUserLocation.accuracy)}m accuracy`
                    : 'Location tracking disabled'
                  }
                </Text>
              </View>
            </View>
            <View style={styles.statusRight}>
              <View style={[styles.onlineStatus, { backgroundColor: currentUserLocation && isLocationStable ? '#10B981' : '#F59E0B' }]} />
              <Text style={styles.onlineText}>{currentUserLocation && isLocationStable ? 'Live' : 'Syncing'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Live Metrics Bar - Only show in list view */}
      {viewMode === 'list' && (
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#6366F1' }]}>
                {loadingNearbyUsers ? '...' : nearbyUsers.length}
              </Text>
              <Text style={styles.metricLabel}>Nearby</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#10B981' }]}>4</Text>
              <Text style={styles.metricLabel}>Hiring</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#3B82F6' }]}>7</Text>
              <Text style={styles.metricLabel}>Open to Chat</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>6</Text>
              <Text style={styles.metricLabel}>Mutual tags</Text>
            </View>
          </View>
        </View>
      )}

      {/* Location Banner - Only show in list view */}
      {viewMode === 'list' && (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.locationBanner}
        >
          <View style={styles.locationContent}>
            <View style={styles.locationLeft}>
              <View style={styles.locationIcon}>
                <MapPin size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.publicModeText}>
                  {currentUserLocation ? 'Enhanced GPS Active' : 'Location Disabled'}
                </Text>
                <Text style={styles.locationSubtext}>
                  {currentUserLocation 
                    ? `${Math.round(currentUserLocation.accuracy)}m accuracy • ${isLocationStable ? 'Stable tracking' : 'Stabilizing...'}`
                    : 'Enable location to find nearby professionals'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={isPublicMode}
              onValueChange={setIsPublicMode}
              trackColor={{ false: '#FFFFFF40', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.viewToggleContainer}>
            <View style={styles.viewToggle}>
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
                onPress={() => setViewMode('list')}
              >
                <List size={16} color={viewMode === 'list' ? '#FFFFFF' : '#FFFFFF80'} />
                <Text style={[styles.viewButtonText, viewMode === 'list' && styles.activeViewButtonText]}>List</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'map' && styles.activeViewButton]}
                onPress={() => setViewMode('map')}
              >
                <Map size={16} color={viewMode === 'map' ? '#FFFFFF' : '#FFFFFF80'} />
                <Text style={[styles.viewButtonText, viewMode === 'map' && styles.activeViewButtonText]}>Map</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.filterIconButton}>
              <Filter size={16} color="#FFFFFF" />
              <Text style={styles.filterIconText}>Filters</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* Enhanced Filters - Only show in list view */}
      {viewMode === 'list' && (
        <View style={styles.filtersSection}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Quick Filters</Text>
            <View style={styles.chatToggle}>
              <Switch
                value={openToChat}
                onValueChange={setOpenToChat}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <Text style={styles.chatToggleText}>Open to chat now</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.quickFilter,
                  activeFilter === filter && styles.activeQuickFilter
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.quickFilterText,
                  activeFilter === filter && styles.activeQuickFilterText
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Interactive MapBox Map View */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          <MapBoxMap
            userLocations={mapUserLocations}
            currentUserLocation={currentUserLocation}
            onUserPinPress={handleUserPinPress}
            style={styles.mapView}
          />
        </View>
      )}

      {/* Quick Actions Bar - Only show in map view */}
      {viewMode === 'map' && (
        <View style={styles.quickActionsBar}>
          <View style={styles.quickActionsLeft}>
            <TouchableOpacity 
              style={styles.listViewButton}
              onPress={() => setViewMode('list')}
            >
              <List size={16} color="#FFFFFF" />
              <Text style={styles.listViewButtonText}>List View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#6B7280" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickActionsRight}>
            <Text style={styles.autoRefreshText}>Auto-refresh</Text>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor="#FFFFFF"
              style={styles.autoRefreshSwitch}
            />
          </View>
        </View>
      )}

      {/* List View Content */}
      {viewMode === 'list' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Results Header */}
          {searchQuery.trim() !== '' && (
            <View style={styles.searchResults}>
              <Text style={styles.searchResultsTitle}>
                Search Results for "{searchQuery}"
              </Text>
              {filteredPeople.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No people found</Text>
                  <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.listContainer}>
            {filteredPeople.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </View>

          {/* Hide other sections when searching */}
          {searchQuery.trim() === '' && (
            <>
              <CrossedPathsSection />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Events Nearby</Text>
                {nearbyEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </View>
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* User Popup Modal */}
      <UserPopupModal />

      {/* Account Settings Modal */}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  appIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
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
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  notificationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF20',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  notificationSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  notificationClose: {
    padding: 8,
  },
  statusPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  },
  statusIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statusRight: {
    alignItems: 'center',
  },
  onlineStatus: {
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    marginBottom: 4,
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  metricsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  locationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF20',
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
  locationSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF20',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  activeViewButton: {
    backgroundColor: '#FFFFFF20',
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF80',
  },
  activeViewButtonText: {
    color: '#FFFFFF',
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  filterIconText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  quickFilters: {
    flexDirection: 'row',
  },
  quickFilter: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeQuickFilter: {
    backgroundColor: '#6366F1',
  },
  quickFilterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeQuickFilterText: {
    color: '#FFFFFF',
  },
  mapContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#E5E7EB',
  },
  mapView: {
    flex: 1,
  },
  quickActionsBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionsLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  listViewButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  listViewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  quickActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoRefreshText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  autoRefreshSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  personImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  personInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  distanceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  personRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 2,
  },
  personEducation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  personBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  interestTagBlue: {
    backgroundColor: '#DBEAFE',
  },
  interestTagGreen: {
    backgroundColor: '#D1FAE5',
  },
  interestTagPurple: {
    backgroundColor: '#F3E8FF',
  },
  interestTagOrange: {
    backgroundColor: '#FED7AA',
  },
  interestText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  interestTextBlue: {
    color: '#1D4ED8',
  },
  interestTextGreen: {
    color: '#059669',
  },
  interestTextPurple: {
    color: '#7C3AED',
  },
  interestTextOrange: {
    color: '#EA580C',
  },
  lookingForContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    gap: 4,
  },
  lookingForText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  crossedPathsContainer: {
    flexDirection: 'row',
  },
  crossedPathItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  crossedPathImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  crossedPathName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  crossedPathTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  eventAttendees: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  joinButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  popupContent: {
    gap: 16,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  popupAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  popupUserInfo: {
    flex: 1,
  },
  popupUserName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  popupUserTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  popupUserDistance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  popupUserStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  popupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popupTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popupTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1D4ED8',
  },
  popupActions: {
    flexDirection: 'row',
    gap: 12,
  },
  popupPrimaryButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  popupPrimaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  popupSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  popupSecondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});