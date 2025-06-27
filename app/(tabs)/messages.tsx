import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Plus, Calendar, Paperclip, Users, MessageCircle, CheckCircle as Check, Clock, MapPin, Bell, ArrowLeft, Send } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import ContinuousTextInput from '@/components/ContinuousTextInput';

type TabType = 'inbox' | 'connections';

interface Conversation {
  conversation_partner_id: string;
  conversation_partner_name: string;
  conversation_partner_avatar: string;
  conversation_partner_role: string;
  last_message_content: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

interface Connection {
  id: string;
  partner_id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  connected_at: string;
  is_online: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export default function MessagesScreen() {
  const { profile, getConversations, getUserConnections, sendMessage, getConversationMessages, markMessageAsRead } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load conversations and connections on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadConversations(),
      loadConnections()
    ]);
    setLoading(false);
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await getConversations();
      
      if (error) {
        console.error('❌ Error loading conversations:', error);
        Alert.alert('Error', 'Failed to load conversations. Please try again.');
        return;
      }

      if (data) {
        setConversations(data);
        setFilteredConversations(data);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading conversations:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading conversations.');
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await getUserConnections();
      
      if (error) {
        console.error('❌ Error loading connections:', error);
        Alert.alert('Error', 'Failed to load connections. Please try again.');
        return;
      }

      if (data) {
        setConnections(data);
        setFilteredConnections(data);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading connections:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading connections.');
    }
  };

  const loadConversationMessages = async (userId: string) => {
    try {
      setLoadingMessages(true);
      
      const { data, error } = await getConversationMessages(userId);
      
      if (error) {
        console.error('❌ Error loading messages:', error);
        Alert.alert('Error', 'Failed to load messages. Please try again.');
        return;
      }

      if (data) {
        setMessages(data);
        
        // Mark unread messages as read
        const unreadMessages = data.filter(
          msg => msg.receiver_id === profile?.id && !msg.is_read
        );
        
        for (const msg of unreadMessages) {
          await markMessageAsRead(msg.id);
        }
        
        // Refresh conversations to update unread counts
        if (unreadMessages.length > 0) {
          loadConversations();
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error loading messages:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedConversation) {
      await loadConversationMessages(selectedConversation);
    }
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredConversations(conversations);
      setFilteredConnections(connections);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    // Filter conversations
    const conversationResults = conversations.filter(conv => 
      conv.conversation_partner_name.toLowerCase().includes(lowercaseQuery) ||
      conv.conversation_partner_role.toLowerCase().includes(lowercaseQuery) ||
      conv.last_message_content.toLowerCase().includes(lowercaseQuery)
    );
    
    // Filter connections
    const connectionResults = connections.filter(conn =>
      conn.name.toLowerCase().includes(lowercaseQuery) ||
      conn.role.toLowerCase().includes(lowercaseQuery) ||
      conn.company.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredConversations(conversationResults);
    setFilteredConnections(connectionResults);
  };

  const handleSendMessage = async (content: string, receiverId: string) => {
    if (!content.trim()) return;
    
    try {
      setSendingMessage(true);
      
      const { data, error } = await sendMessage(receiverId, content);
      
      if (error) {
        console.error('❌ Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      if (data) {
        // Add the new message to the messages list
        setMessages(prev => [...prev, data]);
        
        // If this is a new conversation, refresh conversations
        if (!conversations.some(c => c.conversation_partner_id === receiverId)) {
          loadConversations();
        }
      }
    } catch (error) {
      console.error('❌ Unexpected error sending message:', error);
      Alert.alert('Error', 'An unexpected error occurred while sending your message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewConversation = (connection: Connection) => {
    setSelectedConversation(connection.partner_id);
    setActiveTab('inbox');
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageTime.toLocaleDateString();
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
          tab === 'inbox' && styles.redBadge
        ]}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ConversationCard = ({ conversation, isSelected }: { conversation: Conversation, isSelected: boolean }) => (
    <TouchableOpacity 
      style={[styles.conversationCard, isSelected && styles.selectedConversationCard]}
      onPress={() => setSelectedConversation(conversation.conversation_partner_id)}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: conversation.conversation_partner_avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
          style={styles.avatar} 
        />
        {conversation.is_online && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.senderName}>{conversation.conversation_partner_name}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(conversation.last_message_time)}</Text>
        </View>
        <Text style={styles.senderRole}>{conversation.conversation_partner_role}</Text>
        <Text style={[
          styles.lastMessage,
          conversation.unread_count > 0 && styles.unreadMessage
        ]} numberOfLines={1}>
          {conversation.last_message_content}
        </Text>
      </View>
      {conversation.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{conversation.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ConnectionCard = ({ connection }: { connection: Connection }) => (
    <View style={styles.connectionCard}>
      <View style={styles.connectionHeader}>
        <Image 
          source={{ uri: connection.image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
          style={styles.connectionAvatar} 
        />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{connection.name}</Text>
          <Text style={styles.connectionRole}>{connection.role} at {connection.company}</Text>
          <View style={styles.connectionStatus}>
            {connection.is_online ? (
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online now</Text>
              </View>
            ) : (
              <Text style={styles.connectedSince}>
                Connected {formatTimestamp(connection.connected_at)}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.messageButton}
        onPress={() => handleStartNewConversation(connection)}
      >
        <MessageCircle size={16} color="#FFFFFF" />
        <Text style={styles.messageButtonText}>Send Message</Text>
      </TouchableOpacity>
    </View>
  );

  const ConversationView = () => {
    if (!selectedConversation) {
      return (
        <View style={styles.noConversationSelected}>
          <MessageCircle size={48} color="#D1D5DB" />
          <Text style={styles.noConversationTitle}>No conversation selected</Text>
          <Text style={styles.noConversationSubtitle}>Select a conversation from the list or start a new one</Text>
        </View>
      );
    }

    const partner = conversations.find(c => c.conversation_partner_id === selectedConversation) || 
                    connections.find(c => c.partner_id === selectedConversation);
    
    if (!partner) {
      return (
        <View style={styles.noConversationSelected}>
          <MessageCircle size={48} color="#D1D5DB" />
          <Text style={styles.noConversationTitle}>Conversation not found</Text>
          <Text style={styles.noConversationSubtitle}>The selected conversation could not be found</Text>
        </View>
      );
    }

    const partnerName = 'conversation_partner_name' in partner ? 
                        partner.conversation_partner_name : 
                        partner.name;
    
    const partnerAvatar = 'conversation_partner_avatar' in partner ? 
                          partner.conversation_partner_avatar : 
                          partner.image;
    
    const partnerRole = 'conversation_partner_role' in partner ? 
                        partner.conversation_partner_role : 
                        partner.role;
    
    const isOnline = 'is_online' in partner ? partner.is_online : false;

    return (
      <View style={styles.conversationView}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.conversationPartnerInfo}>
            <Image 
              source={{ uri: partnerAvatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
              style={styles.conversationPartnerAvatar} 
            />
            <View>
              <Text style={styles.conversationPartnerName}>{partnerName}</Text>
              <View style={styles.conversationPartnerStatus}>
                {isOnline ? (
                  <View style={styles.onlineStatusSmall}>
                    <View style={styles.onlineDotSmall} />
                    <Text style={styles.onlineTextSmall}>Online</Text>
                  </View>
                ) : (
                  <Text style={styles.partnerRole}>{partnerRole}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          inverted={true}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingMessages}
              onRefresh={() => loadConversationMessages(selectedConversation)}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {messages.length === 0 && !loadingMessages ? (
            <View style={styles.noMessagesContainer}>
              <Text style={styles.noMessagesText}>No messages yet</Text>
              <Text style={styles.noMessagesSubtext}>Start the conversation by sending a message</Text>
            </View>
          ) : (
            [...messages].reverse().map((message) => {
              const isOwnMessage = message.sender_id === profile?.id;
              
              return (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageItem,
                    isOwnMessage ? styles.ownMessageItem : styles.otherMessageItem
                  ]}
                >
                  {!isOwnMessage && (
                    <Image 
                      source={{ uri: message.sender_avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                      style={styles.messageAvatar} 
                    />
                  )}
                  <View 
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                    ]}>
                      {message.content}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                    ]}>
                      {formatTimestamp(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.messageInputContainer}>
          <ContinuousTextInput
            placeholder="Type a message..."
            onSave={(text) => handleSendMessage(text, selectedConversation)}
            maxLength={500}
            showWordCount={false}
            minHeight={40}
            maxHeight={100}
            multiline={true}
          />
        </View>
      </View>
    );
  };

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

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unread_count, 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
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
                <Text style={styles.notificationBadgeText}>{getUnreadCount()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image 
                source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.profileImage} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Panel - Conversations List */}
        <View style={styles.leftPanel}>
          {/* Search Bar */}
          <SearchBar
            placeholder="Search messages, people..."
            onSearch={handleSearch}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Message Tabs */}
          <View style={styles.tabsContainer}>
            <TabButton
              tab="inbox"
              title="Inbox"
              count={getUnreadCount()}
              isActive={activeTab === 'inbox'}
              onPress={() => setActiveTab('inbox')}
            />
            <TabButton
              tab="connections"
              title="Connections"
              count={connections.length}
              isActive={activeTab === 'connections'}
              onPress={() => setActiveTab('connections')}
            />
          </View>

          {/* Tab Content */}
          <ScrollView 
            style={styles.tabContent} 
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
            {activeTab === 'inbox' && (
              <View style={styles.inboxContent}>
                {searchQuery.trim() === '' && conversations.length > 0 && <ScheduledChatBanner />}
                
                {filteredConversations.length === 0 && (
                  <View style={styles.noResults}>
                    <MessageCircle size={32} color="#D1D5DB" />
                    <Text style={styles.noResultsText}>
                      {searchQuery.trim() !== '' ? 'No conversations found' : 'No conversations yet'}
                    </Text>
                    <Text style={styles.noResultsSubtext}>
                      {searchQuery.trim() !== '' ? 'Try adjusting your search terms' : 'Start a conversation with your connections'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.conversationsList}>
                  {filteredConversations.map((conversation) => (
                    <ConversationCard 
                      key={conversation.conversation_partner_id} 
                      conversation={conversation}
                      isSelected={selectedConversation === conversation.conversation_partner_id}
                    />
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'connections' && (
              <View style={styles.connectionsContent}>
                {filteredConnections.length === 0 && (
                  <View style={styles.noResults}>
                    <Users size={32} color="#D1D5DB" />
                    <Text style={styles.noResultsText}>
                      {searchQuery.trim() !== '' ? 'No connections found' : 'No connections yet'}
                    </Text>
                    <Text style={styles.noResultsSubtext}>
                      {searchQuery.trim() !== '' ? 'Try adjusting your search terms' : 'Connect with professionals to start messaging'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.connectionsList}>
                  {filteredConnections.map((connection) => (
                    <ConnectionCard key={connection.partner_id} connection={connection} />
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>

        {/* Right Panel - Conversation View */}
        <View style={styles.rightPanel}>
          <ConversationView />
        </View>
      </View>

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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  tabBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  inboxContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  connectionsContent: {
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
    marginBottom: 8,
  },
  selectedConversationCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
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
  unreadBadge: {
    width: 20,
    height: 20,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  connectionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  connectionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  connectionRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  connectedSince: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  messageButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomPadding: {
    height: 32,
  },
  conversationView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  conversationPartnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationPartnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  conversationPartnerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  conversationPartnerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatusSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDotSmall: {
    width: 6,
    height: 6,
    backgroundColor: '#10B981',
    borderRadius: 3,
    marginRight: 4,
  },
  onlineTextSmall: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  partnerRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageItem: {
    marginVertical: 8,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageItem: {
    alignSelf: 'flex-end',
  },
  otherMessageItem: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  messageInputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  noConversationSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noConversationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noConversationSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 300,
  },
  noMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noMessagesText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  noMessagesSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});