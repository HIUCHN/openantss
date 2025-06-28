import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Filter, X, Check, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface ConnectionRequest {
  id: string;
  name: string;
  role: string;
  company: string;
  message: string;
  image: string;
  timestamp: string;
  tags: string[];
  mutualConnections: number;
}

export default function ConnectionRequestsScreen() {
  const { getConnectionRequests, acceptConnectionRequest, declineConnectionRequest } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConnectionRequests();
  }, []);

  const loadConnectionRequests = async () => {
    try {
      setLoading(true);
      console.log('📨 Loading connection requests for dedicated screen...');
      
      const { data, error } = await getConnectionRequests();
      
      if (error) {
        console.error('❌ Error loading connection requests:', error);
        Alert.alert('Error', 'Failed to load connection requests. Please try again.');
        return;
      }

      if (data) {
        // Transform the data to match the expected format with proper null checking
        const transformedRequests: ConnectionRequest[] = data.map((request: any) => ({
          id: request.id,
          name: request.sender?.full_name || request.sender?.username || 'Unknown User',
          role: request.sender?.role || 'Professional',
          company: request.sender?.company || 'OpenAnts',
          message: request.message || 'Would like to connect with you.',
          timestamp: formatTimestamp(request.created_at),
          image: request.sender?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
          tags: ['Connection', 'Networking'],
          mutualConnections: Math.floor(Math.random() * 10) + 1, // Mock data for now
        }));

        setRequests(transformedRequests);
        setFilteredRequests(transformedRequests);
        console.log('✅ Connection requests loaded successfully:', transformedRequests.length, 'requests');
      }
    } catch (error) {
      console.error('💥 Unexpected error loading connection requests:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading connection requests.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffMs = now.getTime() - requestTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return requestTime.toLocaleDateString();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConnectionRequests();
    setRefreshing(false);
  };

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

  const handleAcceptRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;

    try {
      // Add the request ID to the processing set
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      console.log('🤝 Accepting connection request:', requestId);
      
      const { error } = await acceptConnectionRequest(requestId);
      
      if (error) {
        console.error('❌ Error accepting connection request:', error);
        Alert.alert('Error', 'Failed to accept connection request. Please try again.');
      } else {
        // Remove the request from local state immediately
        setRequests(prev => {
          const updatedRequests = prev.filter(req => req.id !== requestId);
          return updatedRequests;
        });
        
        setFilteredRequests(prev => {
          const updatedRequests = prev.filter(req => req.id !== requestId);
          return updatedRequests;
        });
        
        Alert.alert('Success', 'Connection request accepted! You are now connected.');
      }
    } catch (error) {
      console.error('❌ Unexpected error accepting connection request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      // Remove the request ID from the processing set
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      const { error } = await declineConnectionRequest(requestId);
      
      if (error) {
        console.error('❌ Error declining connection request:', error);
        Alert.alert('Error', 'Failed to decline connection request. Please try again.');
      } else {
        // Remove the request from local state immediately
        setRequests(prev => {
          const updatedRequests = prev.filter(req => req.id !== requestId);
          return updatedRequests;
        });
        
        setFilteredRequests(prev => {
          const updatedRequests = prev.filter(req => req.id !== requestId);
          return updatedRequests;
        });
        
        Alert.alert('Request Declined', 'Connection request has been declined.');
      }
    } catch (error) {
      console.error('❌ Unexpected error declining connection request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const ConnectionRequestCard = ({ request }: { request: ConnectionRequest }) => {
    const isProcessing = processingRequests.has(request.id);
    
    return (
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
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAcceptRequest(request.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}
            <Text style={styles.acceptButtonText}>
              {isProcessing ? 'Processing...' : 'Accept'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleDeclineRequest(request.id)}
            disabled={isProcessing}
          >
            <X size={16} color="#6B7280" />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
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

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading connection requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  buttonDisabled: {
    opacity: 0.6,
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