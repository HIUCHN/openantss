import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Plus, Calendar, Paperclip, Users, Handshake, CircleCheck as CheckCircle, Clock, MapPin, Bell, ArrowLeft } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import AccountSettingsModal from '@/components/AccountSettingsModal';

type TabType = 'inbox' | 'requests' | 'handshakes';

const conversations = [
  {
    id: 1,
    name: 'Alex Chen',
    role: 'Senior Product Designer',
    lastMessage: 'Thanks for connecting! Would love to discuss the design thinking workshop...',
    timestamp: '2m',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    unread: true,
    online: true,
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Frontend Developer',
    lastMessage: 'Shared portfolio link with you',
    timestamp: '15m',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    unread: false,
    online: false,
    hasAttachment: true,
    attachmentName: 'Portfolio.pdf',
  },
  {
    id: 3,
    name: 'React Meetup Group',
    role: '5 members',
    lastMessage: 'Mike: Who\'s going to the next workshop?',
    timestamp: '1h',
    image: null,
    unread: true,
    online: false,
    isGroup: true,
  },
];

const connectionRequests = [
  {
    id: 1,
    name: 'Mike Johnson',
    role: 'Product Manager at Meta',
    message: 'Hi! Saw your talk about user research. Would love to connect and learn more about your methods.',
    timestamp: '5m ago',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['Product Strategy', 'UX Research'],
  },
  {
    id: 2,
    name: 'Lisa Park',
    role: 'Data Scientist at Airbnb',
    message: 'Interested in collaborating on ML projects. Love your portfolio!',
    timestamp: '12m ago',
    image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['Machine Learning', 'Collaboration'],
  },
];

const handshakeRequests = [
  {
    id: 1,
    name: 'David Lee',
    role: 'iOS Developer at Spotify',
    message: 'Would love to meet at the coffee bar near booth 12. Available for the next 30 minutes!',
    timestamp: 'pending',
    image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: 'Coffee Central, Booth 12',
    status: 'pending',
    type: 'meeting',
  },
  {
    id: 2,
    name: 'James Wilson',
    role: 'Marketing Director at Tesla',
    message: 'Great! See you at table 4 in 10 minutes. Looking forward to our chat!',
    timestamp: 'accepted',
    image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    location: 'Table 4',
    status: 'accepted',
    type: 'meeting',
    timeLeft: 'In 10 minutes',
  },
];

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [filteredRequests, setFilteredRequests] = useState(connectionRequests);
  const [filteredHandshakes, setFilteredHandshakes] = useState(handshakeRequests);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredConversations(conversations);
      setFilteredRequests(connectionRequests);
      setFilteredHandshakes(handshakeRequests);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    // Filter conversations
    const conversationResults = conversations.filter(conv => 
      conv.name.toLowerCase().includes(lowercaseQuery) ||
      conv.role.toLowerCase().includes(lowercaseQuery) ||
      conv.lastMessage.toLowerCase().includes(lowercaseQuery)
    );
    
    // Filter requests
    const requestResults = connectionRequests.filter(req =>
      req.name.toLowerCase().includes(lowercaseQuery) ||
      req.role.toLowerCase().includes(lowercaseQuery) ||
      req.message.toLowerCase().includes(lowercaseQuery) ||
      req.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
    
    // Filter handshakes
    const handshakeResults = handshakeRequests.filter(handshake =>
      handshake.name.toLowerCase().includes(lowercaseQuery) ||
      handshake.role.toLowerCase().includes(lowercaseQuery) ||
      handshake.message.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredConversations(conversationResults);
    setFilteredRequests(requestResults);
    setFilteredHandshakes(handshakeResults);
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  const TabButton = ({ tab, title, count, isActive, onPress }: {
    tab: TabType;
    title: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={[
          styles.tabBadge,
          tab === 'requests' && styles.redBadge,
          tab === 'handshakes' && styles.orangeBadge,
        ]}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ConversationCard = ({ conversation }) => (
    <TouchableOpacity style={styles.conversationCard}>
      <View style={styles.avatarContainer}>
        {conversation.isGroup ? (
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.groupAvatar}
          >
            <Users size={20} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <Image source={{ uri: conversation.image }} style={styles.avatar} />
        )}
        {conversation.online && !conversation.isGroup && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.senderName}>{conversation.name}</Text>
          <Text style={styles.timestamp}>{conversation.timestamp}</Text>
        </View>
        <Text style={styles.senderRole}>{conversation.role}</Text>
        <Text style={[
          styles.lastMessage,
          conversation.unread && styles.unreadMessage
        ]} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
        {conversation.hasAttachment && (
          <View style={styles.attachmentRow}>
            <Paperclip size={12} color="#6B7280" />
            <Text style={styles.attachmentText}>{conversation.attachmentName}</Text>
          </View>
        )}
      </View>
      {conversation.unread && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  const RequestCard = ({ request }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Image source={{ uri: request.image }} style={styles.avatar} />
        <View style={styles.requestInfo}>
          <View style={styles.requestNameRow}>
            <Text style={styles.requestName}>{request.name}</Text>
            <Text style={styles.requestTimestamp}>{request.timestamp}</Text>
          </View>
          <Text style={styles.requestRole}>{request.role}</Text>
        </View>
      </View>
      <Text style={styles.requestMessage}>{request.message}</Text>
      <View style={styles.tagsContainer}>
        {request.tags.map((tag, index) => (
          <View key={index} style={[
            styles.tag,
            index === 0 ? styles.blueTag : styles.greenTag
          ]}>
            <Text style={[
              styles.tagText,
              index === 0 ? styles.blueTagText : styles.greenTagText
            ]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.acceptButton}>
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const HandshakeCard = ({ handshake }) => (
    <View style={styles.handshakeCard}>
      <View style={styles.handshakeHeader}>
        <Image source={{ uri: handshake.image }} style={styles.avatar} />
        <View style={styles.handshakeInfo}>
          <View style={styles.handshakeNameRow}>
            <Text style={styles.handshakeName}>{handshake.name}</Text>
            <View style={[
              styles.statusBadge,
              handshake.status === 'accepted' ? styles.acceptedBadge : styles.pendingBadge
            ]}>
              <Text style={[
                styles.statusBadgeText,
                handshake.status === 'accepted' ? styles.acceptedBadgeText : styles.pendingBadgeText
              ]}>
                {handshake.status === 'accepted' ? 'Accepted' : 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={styles.handshakeRole}>{handshake.role}</Text>
        </View>
      </View>
      
      <View style={[
        styles.meetingContainer,
        handshake.status === 'accepted' ? styles.acceptedMeeting : styles.pendingMeeting
      ]}>
        <View style={styles.meetingHeader}>
          {handshake.status === 'accepted' ? (
            <CheckCircle size={16} color="#10B981" />
          ) : (
            <Handshake size={16} color="#3B82F6" />
          )}
          <Text style={[
            styles.meetingTitle,
            handshake.status === 'accepted' ? styles.acceptedMeetingTitle : styles.pendingMeetingTitle
          ]}>
            {handshake.status === 'accepted' ? 'Meeting Confirmed' : 'Meeting Request'}
          </Text>
        </View>
        <Text style={[
          styles.meetingMessage,
          handshake.status === 'accepted' ? styles.acceptedMeetingMessage : styles.pendingMeetingMessage
        ]}>
          {handshake.message}
        </Text>
        <View style={styles.meetingMeta}>
          {handshake.status === 'accepted' ? (
            <View style={styles.metaRow}>
              <Clock size={12} color="#10B981" />
              <Text style={styles.acceptedMetaText}>{handshake.timeLeft}</Text>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <MapPin size={12} color="#3B82F6" />
              <Text style={styles.pendingMetaText}>{handshake.location}</Text>
            </View>
          )}
        </View>
      </View>

      {handshake.status === 'pending' ? (
        <View style={styles.handshakeActions}>
          <TouchableOpacity style={styles.acceptMeetButton}>
            <Text style={styles.acceptMeetButtonText}>Accept Meet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.sendMessageButton}>
          <Text style={styles.sendMessageButtonText}>Send Message</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ScheduledChatBanner = () => (
    <LinearGradient
      colors={['#DBEAFE', '#EBF8FF']}
      style={styles.scheduledBanner}
    >
      <View style={styles.scheduledContent}>
        <View style={styles.scheduledIcon}>
          <Calendar size={16} color="#3B82F6" />
        </View>
        <View style={styles.scheduledInfo}>
          <Text style={styles.scheduledTitle}>Coffee with Alex Chen</Text>
          <Text style={styles.scheduledTime}>Today at 3:00 PM</Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const getFilteredData = () => {
    switch (activeTab) {
      case 'inbox':
        return filteredConversations;
      case 'requests':
        return filteredRequests;
      case 'handshakes':
        return filteredHandshakes;
      default:
        return [];
    }
  };

  const renderTabContent = () => {
    const data = getFilteredData();
    
    if (searchQuery.trim() !== '' && data.length === 0) {
      return (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'inbox':
        return (
          <View style={styles.tabContent}>
            {searchQuery.trim() === '' && <ScheduledChatBanner />}
            <View style={styles.conversationsList}>
              {filteredConversations.map((conversation) => (
                <ConversationCard key={conversation.id} conversation={conversation} />
              ))}
            </View>
          </View>
        );
      case 'requests':
        return (
          <View style={styles.tabContent}>
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        );
      case 'handshakes':
        return (
          <View style={styles.tabContent}>
            {filteredHandshakes.map((handshake) => (
              <HandshakeCard key={handshake.id} handshake={handshake} />
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton}>
              <ArrowLeft size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Plus size={20} color="#6B7280" />
            </TouchableOpacity>
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

      {/* Search Bar */}
      <SearchBar
        placeholder="Search messages, people, requests..."
        onSearch={handleSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Message Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton
          tab="inbox"
          title="Inbox"
          count={filteredConversations.length}
          isActive={activeTab === 'inbox'}
          onPress={() => setActiveTab('inbox')}
        />
        <TabButton
          tab="requests"
          title="Requests"
          count={filteredRequests.length}
          isActive={activeTab === 'requests'}
          onPress={() => setActiveTab('requests')}
        />
        <TabButton
          tab="handshakes"
          title="Handshakes"
          count={filteredHandshakes.length}
          isActive={activeTab === 'handshakes'}
          onPress={() => setActiveTab('handshakes')}
        />
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        <View style={styles.bottomPadding} />
      </ScrollView>

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
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  activeTabButton: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6366F1',
    fontFamily: 'Inter-Medium',
  },
  tabBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  redBadge: {
    backgroundColor: '#EF4444',
  },
  orangeBadge: {
    backgroundColor: '#F59E0B',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scheduledBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  scheduledContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduledInfo: {
    flex: 1,
  },
  scheduledTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginBottom: 2,
  },
  scheduledTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#3B82F6',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  conversationsList: {
    gap: 4,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  senderRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  unreadMessage: {
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#6366F1',
    borderRadius: 4,
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
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
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  blueTag: {
    backgroundColor: '#DBEAFE',
  },
  greenTag: {
    backgroundColor: '#D1FAE5',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  blueTagText: {
    color: '#1D4ED8',
  },
  greenTagText: {
    color: '#059669',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
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
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  handshakeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  handshakeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  handshakeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  handshakeNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  handshakeName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  acceptedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  pendingBadgeText: {
    color: '#F59E0B',
  },
  acceptedBadgeText: {
    color: '#10B981',
  },
  handshakeRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  meetingContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pendingMeeting: {
    backgroundColor: '#EBF8FF',
  },
  acceptedMeeting: {
    backgroundColor: '#F0FDF4',
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  meetingTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  pendingMeetingTitle: {
    color: '#1E40AF',
  },
  acceptedMeetingTitle: {
    color: '#065F46',
  },
  meetingMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    lineHeight: 20,
  },
  pendingMeetingMessage: {
    color: '#1E40AF',
  },
  acceptedMeetingMessage: {
    color: '#065F46',
  },
  meetingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#3B82F6',
  },
  acceptedMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  handshakeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptMeetButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptMeetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  sendMessageButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sendMessageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  bottomPadding: {
    height: 100,
  },
});