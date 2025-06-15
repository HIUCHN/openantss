import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Bell, MessageCircle, ChevronRight, Briefcase, Users, QrCode, UserPlus, X, Check, Settings } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import OpenAntsLogo from '@/components/OpenAntsLogo';
import { router } from 'expo-router';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import DebugPanel from '@/components/DebugPanel';

// Debug mode toggle - set to true to show debug information
const isDebug = true;

const smartMatches = [
  {
    id: 1,
    name: 'Alex Chen',
    role: 'Senior Product Designer',
    company: 'Spotify',
    distance: '15m away',
    interests: ['UI/UX', 'Mentoring'],
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 95,
    matchColor: '#10B981',
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Frontend Developer',
    company: 'Airbnb',
    distance: '8m away',
    interests: ['React', 'Freelancing'],
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 88,
    matchColor: '#F59E0B',
  },
];

const connectionRequests = [
  {
    id: 1,
    name: 'Emily Rodriguez',
    role: 'UX Researcher',
    company: 'Meta',
    message: 'Hi! I saw your presentation on design systems. Would love to connect and discuss collaboration opportunities.',
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '2m ago',
    tags: ['Design Systems', 'UX Research'],
    mutualConnections: 3,
  },
  {
    id: 2,
    name: 'James Wilson',
    role: 'Product Manager',
    company: 'Tesla',
    message: 'Interested in your work on AI-powered design tools. Let\'s connect!',
    image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '15m ago',
    tags: ['AI/ML', 'Product Strategy'],
    mutualConnections: 1,
  },
  {
    id: 3,
    name: 'Maria Garcia',
    role: 'Frontend Developer',
    company: 'Stripe',
    message: 'Love your portfolio! Would be great to connect and share experiences.',
    image: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '1h ago',
    tags: ['Frontend', 'React'],
    mutualConnections: 5,
  },
];

const liveAlerts = [
  {
    id: 1,
    type: 'hiring',
    icon: Briefcase,
    title: '3 professionals hiring designers nearby',
    subtitle: 'Tap to see opportunities',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 2,
    type: 'meetup',
    icon: Users,
    title: 'Tech meetup members detected',
    subtitle: '5 people from React meetup group',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
];

const recentConnections = [
  {
    id: 'mike-johnson',
    name: 'Mike Johnson',
    role: 'Product Manager',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'lisa-park',
    name: 'Lisa Park',
    role: 'Data Scientist',
    image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'david-lee',
    name: 'David Lee',
    role: 'iOS Developer',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function HomeScreen() {
  const [isPublicMode, setIsPublicMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState(connectionRequests);
  const [filteredMatches, setFilteredMatches] = useState(smartMatches);
  const [filteredConnections, setFilteredConnections] = useState(recentConnections);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredMatches(smartMatches);
      setFilteredConnections(recentConnections);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    // Filter matches
    const matchResults = smartMatches.filter(match => 
      match.name.toLowerCase().includes(lowercaseQuery) ||
      match.role.toLowerCase().includes(lowercaseQuery) ||
      match.company.toLowerCase().includes(lowercaseQuery) ||
      match.interests.some(interest => interest.toLowerCase().includes(lowercaseQuery))
    );
    
    // Filter connections
    const connectionResults = recentConnections.filter(connection =>
      connection.name.toLowerCase().includes(lowercaseQuery) ||
      connection.role.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredMatches(matchResults);
    setFilteredConnections(connectionResults);
  };

  const handleAcceptRequest = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleDeclineRequest = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleViewAllRequests = () => {
    // Navigate to a dedicated connection requests screen
    router.push('/connection-requests');
  };

  const handleNearbyNavigation = () => {
    // Navigate to Nearby tab
    router.push('/(tabs)/nearby');
  };

  const handleMatchesNavigation = () => {
    // Navigate to Smart Matches screen
    router.push('/smart-matches');
  };

  const handleRequestsNavigation = () => {
    // Navigate to Connection Requests screen
    router.push('/connection-requests');
  };

  const handleConnectionPress = (connectionId: string) => {
    // Navigate to user profile
    router.push(`/user-profile/${connectionId}`);
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  const StatCard = ({ number, label, color = '#6366F1', onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.statNumber, { color }]}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const MatchCard = ({ match }) => (
    <View style={styles.matchCard}>
      <Image source={{ uri: match.image }} style={styles.matchImage} />
      <View style={styles.matchInfo}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchName}>{match.name}</Text>
          <View style={[styles.matchScore, { backgroundColor: `${match.matchColor}20` }]}>
            <Text style={[styles.matchScoreText, { color: match.matchColor }]}>
              {match.matchScore}% Match
            </Text>
          </View>
        </View>
        <Text style={styles.matchRole}>{match.role} at {match.company}</Text>
        
        <View style={styles.interestsRow}>
          {match.interests.map((interest, index) => (
            <View key={index} style={[styles.interestTag, 
              index === 0 ? styles.interestTagBlue : styles.interestTagPurple
            ]}>
              <Text style={[styles.interestText,
                index === 0 ? styles.interestTextBlue : styles.interestTextPurple
              ]}>
                {interest}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.matchFooter}>
          <View style={styles.matchMeta}>
            <MapPin size={12} color="#6B7280" />
            <Text style={styles.matchDistance}>{match.distance}</Text>
          </View>
          <View style={styles.matchActions}>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <MessageCircle size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const AlertCard = ({ alert }) => {
    const IconComponent = alert.icon;
    return (
      <TouchableOpacity style={[styles.alertCard, { backgroundColor: alert.bgColor, borderLeftColor: alert.color }]}>
        <View style={[styles.alertIcon, { backgroundColor: alert.color }]}>
          <IconComponent size={16} color="#FFFFFF" />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
        </View>
        <ChevronRight size={16} color={alert.color} />
      </TouchableOpacity>
    );
  };

  const ConnectionRequestCard = ({ request, isCompact = false }) => (
    <View style={[styles.requestCard, isCompact && styles.compactRequestCard]}>
      <View style={styles.requestHeader}>
        <Image source={{ uri: request.image }} style={styles.requestAvatar} />
        <View style={styles.requestInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.requestName}>{request.name}</Text>
            <Text style={styles.requestTimestamp}>{request.timestamp}</Text>
          </View>
          <Text style={styles.requestRole}>{request.role} at {request.company}</Text>
          {request.mutualConnections > 0 && (
            <Text style={styles.mutualConnections}>
              {request.mutualConnections} mutual connection{request.mutualConnections > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
      
      {!isCompact && (
        <>
          <Text style={styles.requestMessage}>{request.message}</Text>
          <View style={styles.requestTags}>
            {request.tags.map((tag, index) => (
              <View key={index} style={[
                styles.requestTag,
                index === 0 ? styles.blueRequestTag : styles.greenRequestTag
              ]}>
                <Text style={[
                  styles.requestTagText,
                  index === 0 ? styles.blueRequestTagText : styles.greenRequestTagText
                ]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request.id)}
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(request.id)}
        >
          <X size={16} color="#6B7280" />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ConnectionRequestsSection = () => {
    const displayedRequests = showAllRequests ? requests : requests.slice(0, 2);
    
    if (requests.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.requestsSectionTitle}>
            <UserPlus size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Connection Requests</Text>
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsBadgeText}>{requests.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleViewAllRequests}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {displayedRequests.map((request) => (
          <ConnectionRequestCard 
            key={request.id} 
            request={request} 
            isCompact={!showAllRequests}
          />
        ))}
        
        {!showAllRequests && requests.length > 2 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setShowAllRequests(true)}
          >
            <Text style={styles.showMoreText}>Show {requests.length - 2} more requests</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.appIcon}>
              <OpenAntsLogo size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>OpenAnts</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Debug Toggle Button - Only show when isDebug is true */}
            {isDebug && (
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Settings size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{requests.length}</Text>
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

      {/* Search Bar */}
      <SearchBar
        placeholder="Search people, companies, skills..."
        onSearch={handleSearch}
        showFilter={true}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Location Toggle Banner */}
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
              <Text style={styles.publicModeText}>Public Mode</Text>
              <Text style={styles.locationText}>Coffee Central, Downtown</Text>
            </View>
          </View>
          <Switch
            value={isPublicMode}
            onValueChange={setIsPublicMode}
            trackColor={{ false: '#FFFFFF40', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <StatCard 
            number="12" 
            label="Nearby" 
            color="#6366F1" 
            onPress={handleNearbyNavigation}
          />
          <StatCard 
            number="5" 
            label="Matches" 
            color="#10B981" 
            onPress={handleMatchesNavigation}
          />
          <StatCard 
            number={requests.length.toString()} 
            label="Requests" 
            color="#F59E0B" 
            onPress={handleRequestsNavigation}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Results or Default Content */}
        {searchQuery.trim() !== '' && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>
              Search Results for "{searchQuery}"
            </Text>
            {filteredMatches.length === 0 && filteredConnections.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          </View>
        )}

        {/* Smart Matches Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery.trim() !== '' ? 'Matching People' : 'Smart Matches'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/smart-matches')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {filteredMatches.slice(0, 2).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </View>

        {/* Connection Requests Section - Now below Smart Matches, only show when not searching */}
        {searchQuery.trim() === '' && <ConnectionRequestsSection />}

        {/* Live Alerts Section - Hide when searching */}
        {searchQuery.trim() === '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Alerts</Text>
            
            {liveAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </View>
        )}

        {/* Recent Connections Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() !== '' ? 'Matching Connections' : 'Recent Connections'}
          </Text>
          
          <View style={styles.connectionsGrid}>
            {filteredConnections.map((connection) => (
              <TouchableOpacity 
                key={connection.id} 
                style={styles.connectionItem}
                onPress={() => handleConnectionPress(connection.id)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: connection.image }} style={styles.connectionImage} />
                <Text style={styles.connectionName}>{connection.name}</Text>
                <Text style={styles.connectionRole}>{connection.role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.fabGradient}
        >
          <QrCode size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />

      {/* Debug Panel - Only show when isDebug is true */}
      <DebugPanel isVisible={isDebug && showDebugPanel} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  appName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugButton: {
    padding: 8,
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
  locationBanner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  locationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  requestsSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  requestsBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compactRequestCard: {
    padding: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  requestName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  requestTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  requestRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  mutualConnections: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  requestTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  requestTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  blueRequestTag: {
    backgroundColor: '#DBEAFE',
  },
  greenRequestTag: {
    backgroundColor: '#D1FAE5',
  },
  requestTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  blueRequestTagText: {
    color: '#1D4ED8',
  },
  greenRequestTagText: {
    color: '#059669',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  matchImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  matchScore: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchScoreText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  matchRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  interestTagBlue: {
    backgroundColor: '#DBEAFE',
  },
  interestTagPurple: {
    backgroundColor: '#F3E8FF',
  },
  interestText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  interestTextBlue: {
    color: '#1D4ED8',
  },
  interestTextPurple: {
    color: '#7C3AED',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDistance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  matchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  messageButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 6,
    borderRadius: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  connectionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  connectionItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  connectionImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  connectionName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    textAlign: 'center',
  },
  connectionRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  bottomPadding: {
    height: 100,
  },
});