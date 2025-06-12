import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Filter, X, Check, Users } from 'lucide-react-native';
import { router } from 'expo-router';

interface ConnectionRequest {
  id: number;
  name: string;
  role: string;
  company: string;
  message: string;
  image: string;
  timestamp: string;
  tags: string[];
  mutualConnections: number;
}

// Same data as in the home screen
const connectionRequests: ConnectionRequest[] = [
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
  {
    id: 4,
    name: 'David Chen',
    role: 'Backend Engineer',
    company: 'Spotify',
    message: 'Saw your work on microservices architecture. Would love to discuss best practices!',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '2h ago',
    tags: ['Backend', 'Microservices'],
    mutualConnections: 2,
  },
  {
    id: 5,
    name: 'Sophie Martinez',
    role: 'Data Scientist',
    company: 'Google',
    message: 'Your machine learning insights are fascinating! Let\'s connect and share knowledge.',
    image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '3h ago',
    tags: ['Machine Learning', 'Data Science'],
    mutualConnections: 4,
  },
  {
    id: 6,
    name: 'Alex Thompson',
    role: 'Mobile Developer',
    company: 'Airbnb',
    message: 'Your React Native expertise would be valuable for our team. Let\'s connect!',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '4h ago',
    tags: ['React Native', 'Mobile'],
    mutualConnections: 6,
  },
  {
    id: 7,
    name: 'Lisa Wang',
    role: 'Product Designer',
    company: 'Figma',
    message: 'Love your design philosophy! Would be great to exchange ideas and collaborate.',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '5h ago',
    tags: ['Product Design', 'Figma'],
    mutualConnections: 8,
  },
  {
    id: 8,
    name: 'Michael Brown',
    role: 'DevOps Engineer',
    company: 'AWS',
    message: 'Interested in your cloud architecture insights. Let\'s connect and share experiences!',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    timestamp: '6h ago',
    tags: ['DevOps', 'Cloud'],
    mutualConnections: 3,
  },
];

export default function ConnectionRequestsScreen() {
  const [requests, setRequests] = useState<ConnectionRequest[]>(connectionRequests);
  const [filteredRequests, setFilteredRequests] = useState<ConnectionRequest[]>(connectionRequests);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredRequests(requests);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const results = requests.filter(request => 
      request.name.toLowerCase().includes(lowercaseQuery) ||
      request.role.toLowerCase().includes(lowercaseQuery) ||
      request.company.toLowerCase().includes(lowercaseQuery) ||
      request.message.toLowerCase().includes(lowercaseQuery) ||
      request.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredRequests(results);
  };

  const handleAcceptRequest = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setFilteredRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleDeclineRequest = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    setFilteredRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const ConnectionRequestCard = ({ request }: { request: ConnectionRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Image source={{ uri: request.image }} style={styles.requestAvatar} />
        <View style={styles.requestInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.requestName}>{request.name}</Text>
            <Text style={styles.requestTimestamp}>{request.timestamp}</Text>
          </View>
          <Text style={styles.requestRole}>{request.role} at {request.company}</Text>
          {request.mutualConnections > 0 && (
            <View style={styles.mutualConnectionsRow}>
              <Users size={12} color="#6366F1" />
              <Text style={styles.mutualConnections}>
                {request.mutualConnections} mutual connection{request.mutualConnections > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connection Requests</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests by name, company, or message..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
          {searchQuery.trim() !== '' && ` for "${searchQuery}"`}
        </Text>
      </View>

      {/* Requests List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim() !== '' && filteredRequests.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No requests found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
          </View>
        )}

        {filteredRequests.length === 0 && searchQuery.trim() === '' && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No connection requests</Text>
            <Text style={styles.noResultsSubtext}>New requests will appear here</Text>
          </View>
        )}

        <View style={styles.requestsList}>
          {filteredRequests.map((request) => (
            <ConnectionRequestCard key={request.id} request={request} />
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  resultsHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  requestsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  requestTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  requestRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  mutualConnectionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutualConnections: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
  },
  requestMessage: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  requestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  requestTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  declineButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});