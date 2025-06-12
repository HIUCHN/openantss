import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, MessageCircle, Filter, Dessert as SortDesc } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import { router } from 'expo-router';

const allSmartMatches = [
  {
    id: 1,
    name: 'Alex Chen',
    role: 'Senior Product Designer',
    company: 'Spotify',
    distance: '15m away',
    interests: ['UI/UX', 'Mentoring', 'Design Systems'],
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 95,
    matchColor: '#10B981',
    bio: 'Passionate about creating user-centered experiences. Love mentoring junior designers.',
    mutualConnections: 8,
    tags: ['#ProductDesign', '#Figma', '#UserResearch']
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Frontend Developer',
    company: 'Airbnb',
    distance: '8m away',
    interests: ['React', 'Freelancing', 'Web Development'],
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 88,
    matchColor: '#F59E0B',
    bio: 'Full-stack developer passionate about React and modern web technologies.',
    mutualConnections: 5,
    tags: ['#React', '#JavaScript', '#Frontend']
  },
  {
    id: 3,
    name: 'Mike Johnson',
    role: 'Product Manager',
    company: 'Tesla',
    distance: '12m away',
    interests: ['Product Strategy', 'Innovation', 'Startups'],
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 82,
    matchColor: '#3B82F6',
    bio: 'Product strategist with experience in automotive tech. Love discussing innovation.',
    mutualConnections: 3,
    tags: ['#ProductStrategy', '#Innovation', '#Tesla']
  },
  {
    id: 4,
    name: 'Lisa Park',
    role: 'Data Scientist',
    company: 'Google',
    distance: '20m away',
    interests: ['Machine Learning', 'Analytics', 'Python'],
    image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 78,
    matchColor: '#8B5CF6',
    bio: 'Data scientist passionate about ML and AI. Always excited to collaborate on innovative projects.',
    mutualConnections: 12,
    tags: ['#MachineLearning', '#Python', '#DataScience']
  },
  {
    id: 5,
    name: 'David Lee',
    role: 'iOS Developer',
    company: 'Apple',
    distance: '25m away',
    interests: ['Swift', 'Mobile Development', 'iOS'],
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 75,
    matchColor: '#EF4444',
    bio: 'iOS developer with 6+ years of experience building consumer apps.',
    mutualConnections: 2,
    tags: ['#iOS', '#Swift', '#Mobile']
  },
  {
    id: 6,
    name: 'Emma Rodriguez',
    role: 'UX Researcher',
    company: 'Meta',
    distance: '18m away',
    interests: ['User Research', 'Psychology', 'Design Thinking'],
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 72,
    matchColor: '#06B6D4',
    bio: 'UX researcher focused on understanding user behavior and improving digital experiences.',
    mutualConnections: 6,
    tags: ['#UXResearch', '#Psychology', '#UserTesting']
  },
  {
    id: 7,
    name: 'James Wilson',
    role: 'Backend Engineer',
    company: 'Stripe',
    distance: '30m away',
    interests: ['Node.js', 'Microservices', 'Cloud Architecture'],
    image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 68,
    matchColor: '#84CC16',
    bio: 'Backend engineer specializing in scalable systems and cloud infrastructure.',
    mutualConnections: 4,
    tags: ['#Backend', '#NodeJS', '#AWS']
  },
  {
    id: 8,
    name: 'Maria Garcia',
    role: 'Marketing Director',
    company: 'Shopify',
    distance: '22m away',
    interests: ['Digital Marketing', 'Growth Hacking', 'Analytics'],
    image: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=400',
    matchScore: 65,
    matchColor: '#F97316',
    bio: 'Marketing director with expertise in growth strategies and digital campaigns.',
    mutualConnections: 7,
    tags: ['#Marketing', '#Growth', '#Analytics']
  }
];

export default function SmartMatchesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMatches, setFilteredMatches] = useState(allSmartMatches);
  const [sortBy, setSortBy] = useState('match'); // 'match', 'distance', 'connections'

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredMatches(allSmartMatches);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const results = allSmartMatches.filter(match => 
      match.name.toLowerCase().includes(lowercaseQuery) ||
      match.role.toLowerCase().includes(lowercaseQuery) ||
      match.company.toLowerCase().includes(lowercaseQuery) ||
      match.bio.toLowerCase().includes(lowercaseQuery) ||
      match.interests.some(interest => interest.toLowerCase().includes(lowercaseQuery)) ||
      match.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredMatches(results);
  };

  const sortMatches = (matches) => {
    switch (sortBy) {
      case 'match':
        return [...matches].sort((a, b) => b.matchScore - a.matchScore);
      case 'distance':
        return [...matches].sort((a, b) => {
          const aDistance = parseInt(a.distance.replace(/\D/g, ''));
          const bDistance = parseInt(b.distance.replace(/\D/g, ''));
          return aDistance - bDistance;
        });
      case 'connections':
        return [...matches].sort((a, b) => b.mutualConnections - a.mutualConnections);
      default:
        return matches;
    }
  };

  const sortedMatches = sortMatches(filteredMatches);

  const MatchCard = ({ match }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Image source={{ uri: match.image }} style={styles.matchImage} />
        <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={styles.matchName}>{match.name}</Text>
            <View style={[styles.matchScore, { backgroundColor: `${match.matchColor}20` }]}>
              <Text style={[styles.matchScoreText, { color: match.matchColor }]}>
                {match.matchScore}% Match
              </Text>
            </View>
          </View>
          <Text style={styles.matchRole}>{match.role} at {match.company}</Text>
          <View style={styles.matchMeta}>
            <View style={styles.metaItem}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.metaText}>{match.distance}</Text>
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
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim() !== '' && sortedMatches.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No matches found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
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