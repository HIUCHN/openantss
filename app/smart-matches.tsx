import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, MessageCircle, Filter, Dessert as SortDesc, Users, RefreshCw } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SmartMatch {
  id: string;
  match_id: string;
  match_score: number;
  distance: number;
  name: string;
  role: string;
  company: string;
  distance_text: string;
  interests: string[];
  image: string;
  matchColor: string;
  bio: string;
  mutualConnections: number;
  tags: string[];
}

export default function SmartMatchesScreen() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [smartMatches, setSmartMatches] = useState<SmartMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<SmartMatch[]>([]);
  const [sortBy, setSortBy] = useState('match'); // 'match', 'distance', 'connections'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSmartMatches();
  }, []);

  const fetchSmartMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching smart matches...');
      
      // First, generate smart matches from nearby users
      const { data: generateResult, error: generateError } = await supabase.rpc(
        'store_smart_matches_from_nearby',
        { radius_meters: 5000 }
      );
      
      if (generateError) {
        console.error('❌ Error generating smart matches:', generateError);
        if (generateError.message.includes('location not available')) {
          setError('Location sharing must be enabled in the Nearby tab to find smart matches.');
        } else {
          setError('Failed to generate smart matches. Please try again.');
        }
        return;
      }
      
      console.log('✅ Smart matches generated:', generateResult);
      
      // Then, fetch the generated matches with profile details
      const { data, error } = await supabase.rpc('get_smart_matches', { limit_count: 50 });
      
      if (error) {
        console.error('❌ Error fetching smart matches:', error);
        setError('Failed to load smart matches. Please try again.');
        return;
      }

      if (!data || data.length === 0) {
        console.log('📭 No smart matches found');
        setSmartMatches([]);
        setFilteredMatches([]);
        return;
      }

      console.log('✅ Fetched smart matches:', data.length);

      // Transform data into the format expected by the UI
      const matchColors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];
      
      const transformedMatches: SmartMatch[] = data.map((match, index) => {
        const matchColor = matchColors[index % matchColors.length];
        
        return {
          id: match.id,
          match_id: match.match_id,
          match_score: match.match_score,
          distance: match.distance,
          name: match.full_name || match.username,
          role: match.role || 'Professional',
          company: match.company || 'OpenAnts',
          distance_text: `${Math.round(match.distance)}m away`,
          interests: match.interests || ['Networking', 'Professional Development'],
          image: match.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
          matchColor,
          bio: match.bio || 'A professional looking to connect and collaborate.',
          mutualConnections: Math.floor(Math.random() * 10) + 1, // Random for now
          tags: match.skills || ['#Networking', '#Professional']
        };
      });

      setSmartMatches(transformedMatches);
      setFilteredMatches(transformedMatches);
    } catch (error) {
      console.error('❌ Unexpected error fetching smart matches:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSmartMatches();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredMatches(smartMatches);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const results = smartMatches.filter(match => 
      match.name.toLowerCase().includes(lowercaseQuery) ||
      match.role.toLowerCase().includes(lowercaseQuery) ||
      match.company.toLowerCase().includes(lowercaseQuery) ||
      match.bio?.toLowerCase().includes(lowercaseQuery) ||
      match.interests.some(interest => interest.toLowerCase().includes(lowercaseQuery)) ||
      match.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredMatches(results);
  };

  const sortMatches = (matches: SmartMatch[]) => {
    switch (sortBy) {
      case 'match':
        return [...matches].sort((a, b) => b.match_score - a.match_score);
      case 'distance':
        return [...matches].sort((a, b) => a.distance - b.distance);
      case 'connections':
        return [...matches].sort((a, b) => b.mutualConnections - a.mutualConnections);
      default:
        return matches;
    }
  };

  const sortedMatches = sortMatches(filteredMatches);

  const MatchCard = ({ match }: { match: SmartMatch }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Image source={{ uri: match.image }} style={styles.matchImage} />
        <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={styles.matchName}>{match.name}</Text>
            <View style={[styles.matchScore, { backgroundColor: `${match.matchColor}20` }]}>
              <Text style={[styles.matchScoreText, { color: match.matchColor }]}>
                {match.match_score}% Match
              </Text>
            </View>
          </View>
          <Text style={styles.matchRole}>{match.role} at {match.company}</Text>
          <View style={styles.matchMeta}>
            <View style={styles.metaItem}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.metaText}>{match.distance_text}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.mutualText}>{match.mutualConnections} mutual</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.matchBio}>{match.bio}</Text>
      
      <View style={styles.interestsRow}>
        {match.interests.slice(0, 3).map((interest, index) => (
          <View key={index} style={[styles.interestTag, 
            index === 0 ? styles.interestTagBlue : 
            index === 1 ? styles.interestTagPurple : styles.interestTagGreen
          ]}>
            <Text style={[styles.interestText,
              index === 0 ? styles.interestTextBlue : 
              index === 1 ? styles.interestTextPurple : styles.interestTextGreen
            ]}>
              {interest}
            </Text>
          </View>
        ))}
        {match.interests.length > 3 && (
          <View style={styles.moreInterestsTag}>
            <Text style={styles.moreInterestsText}>+{match.interests.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.tagsRow}>
        {match.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.matchActions}>
        <TouchableOpacity style={styles.connectButton}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <MessageCircle size={16} color="#6B7280" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewProfileButton}>
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SortButton = ({ value, label, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.sortButton, isActive && styles.activeSortButton]}
      onPress={onPress}
    >
      <Text style={[styles.sortButtonText, isActive && styles.activeSortButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Matches</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading smart matches...</Text>
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
        <Text style={styles.headerTitle}>Smart Matches</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={handleRefresh}
        >
          <RefreshCw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search matches by name, role, skills..."
        onSearch={handleSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsInfo}>
          <SortDesc size={16} color="#6B7280" />
          <Text style={styles.resultsText}>
            {sortedMatches.length} matches found
            {searchQuery.trim() !== '' && ` for "${searchQuery}"`}
          </Text>
        </View>
        <Text style={styles.sortLabel}>Sort by:</Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <SortButton
          value="match"
          label="Match %"
          isActive={sortBy === 'match'}
          onPress={() => setSortBy('match')}
        />
        <SortButton
          value="distance"
          label="Distance"
          isActive={sortBy === 'distance'}
          onPress={() => setSortBy('distance')}
        />
        <SortButton
          value="connections"
          label="Mutual Connections"
          isActive={sortBy === 'connections'}
          onPress={() => setSortBy('connections')}
        />
      </View>

      {/* Matches List */}
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
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchSmartMatches}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!error && searchQuery.trim() !== '' && sortedMatches.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No matches found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
          </View>
        )}
        
        {!error && searchQuery.trim() === '' && sortedMatches.length === 0 && (
          <View style={styles.noResults}>
            <View style={styles.noResultsIcon}>
              <Users size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.noResultsText}>No smart matches found</Text>
            <Text style={styles.noResultsSubtext}>
              Try enabling location sharing in the Nearby tab to find professionals around you
            </Text>
            <TouchableOpacity 
              style={styles.nearbyButton}
              onPress={() => router.push('/(tabs)/nearby')}
            >
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.nearbyButtonText}>Go to Nearby</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.matchesList}>
          {sortedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  sortLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  activeSortButton: {
    backgroundColor: '#6366F1',
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  matchesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  matchCard: {
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
  matchHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  matchImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  matchScore: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchScoreText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  matchRole: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
  },
  matchMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  mutualText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
  },
  matchBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsRow: {
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
  interestTagPurple: {
    backgroundColor: '#F3E8FF',
  },
  interestTagGreen: {
    backgroundColor: '#D1FAE5',
  },
  interestText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  interestTextBlue: {
    color: '#1D4ED8',
  },
  interestTextPurple: {
    color: '#7C3AED',
  },
  interestTextGreen: {
    color: '#059669',
  },
  moreInterestsTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  moreInterestsText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  noResultsIcon: {
    backgroundColor: '#F3F4F6',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  nearbyButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  nearbyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});