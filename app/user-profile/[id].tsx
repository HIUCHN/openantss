import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share, MoveVertical as MoreVertical, CircleCheck as CheckCircle, UserPlus, Plus, Users, MapPin, Brain, Calendar, Clock, Heart, MessageCircle, Handshake, Lightbulb, Bookmark, Hand, Building, GraduationCap, Hash as Hashtag, Image as ImageIcon, Smartphone } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserEducation = Database['public']['Tables']['user_education']['Row'];
type Experience = Database['public']['Tables']['experiences']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

interface UserProfileData {
  profile: Profile | null;
  education: UserEducation[];
  experiences: Experience[];
  posts: Post[];
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { profile: currentUserProfile, sendConnectionRequest, checkConnectionStatus } = useAuth();
  const [userData, setUserData] = useState<UserProfileData>({
    profile: null,
    education: [],
    experiences: [],
    posts: []
  });
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    hasPendingRequest: boolean;
    requestId?: string;
  } | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserData(id as string);
      if (currentUserProfile?.id && id !== currentUserProfile.id) {
        fetchConnectionStatus(id as string);
      }
    }
  }, [id, currentUserProfile?.id]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching user data for ID:', userId);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        setError('User profile not found');
        return;
      }

      if (!profileData) {
        setError('User profile not found');
        return;
      }

      console.log('✅ Profile data fetched:', profileData);

      // Fetch user education
      const { data: educationData, error: educationError } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', userId)
        .order('start_year', { ascending: false });

      if (educationError) {
        console.error('❌ Error fetching education:', educationError);
      }

      // Fetch user experiences
      const { data: experiencesData, error: experiencesError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (experiencesError) {
        console.error('❌ Error fetching experiences:', experiencesError);
      }

      // Fetch user posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            role,
            company
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('❌ Error fetching posts:', postsError);
      }

      setUserData({
        profile: profileData,
        education: educationData || [],
        experiences: experiencesData || [],
        posts: postsData || []
      });

      console.log('✅ All user data fetched successfully');
    } catch (error) {
      console.error('💥 Unexpected error fetching user data:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async (userId: string) => {
    try {
      const { data, error } = await checkConnectionStatus(userId);
      if (error) {
        console.error('❌ Error checking connection status:', error);
      } else {
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error('❌ Unexpected error checking connection status:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleConnect = async () => {
    if (!userData.profile || sendingRequest) return;

    try {
      setSendingRequest(true);
      
      const message = `Hi ${userData.profile.full_name || userData.profile.username}, I'd like to connect with you on OpenAnts!`;
      
      const { error } = await sendConnectionRequest(userData.profile.id, message);
      
      if (error) {
        if (error.message.includes('already sent')) {
          Alert.alert('Request Already Sent', 'You have already sent a connection request to this user.');
        } else if (error.message.includes('Already connected')) {
          Alert.alert('Already Connected', 'You are already connected with this user.');
        } else {
          Alert.alert('Error', 'Failed to send connection request. Please try again.');
        }
      } else {
        Alert.alert('Success', 'Connection request sent successfully!');
        // Update connection status to reflect the pending request
        setConnectionStatus({
          isConnected: false,
          hasPendingRequest: true
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error sending connection request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleFollow = () => {
    // Handle follow action
    console.log('Following', userData.profile?.full_name);
    Alert.alert('Following', `You are now following ${userData.profile?.full_name || userData.profile?.username}!`);
  };

  const handleMessage = () => {
    // Handle message action
    console.log('Messaging', userData.profile?.full_name);
    Alert.alert('Message', `Opening chat with ${userData.profile?.full_name || userData.profile?.username}...`);
  };

  const handleWave = () => {
    // Handle wave action
    console.log('Waving to', userData.profile?.full_name);
    Alert.alert('Wave Sent', `You waved to ${userData.profile?.full_name || userData.profile?.username}! 👋`);
  };

  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now.getTime() - postTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return postTime.toLocaleDateString();
  };

  const SkillTag = ({ skill }) => {
    const colorMap = {
      0: { bg: '#DBEAFE', text: '#1D4ED8' },
      1: { bg: '#F3E8FF', text: '#7C3AED' },
      2: { bg: '#D1FAE5', text: '#059669' },
      3: { bg: '#FED7AA', text: '#EA580C' },
      4: { bg: '#FCE7F3', text: '#BE185D' },
      5: { bg: '#E0E7FF', text: '#4338CA' }
    };
    
    const colorIndex = skill.length % 6;
    const colors = colorMap[colorIndex];
    
    return (
      <View style={[styles.skillTag, { backgroundColor: colors.bg }]}>
        <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
      </View>
    );
  };

  const ActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          onPress={() => setShowActionModal(false)}
        />
        <View style={styles.actionModalContent}>
          <View style={styles.modalHandle} />
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleMessage}>
              <View style={[styles.actionIcon, { backgroundColor: '#6366F1' }]}>
                <MessageCircle size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleWave}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Hand size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Wave</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                <Bookmark size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Calendar size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
                <MapPin size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Meet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#6B7280' }]}>
                <Share size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getConnectButtonContent = () => {
    if (sendingRequest) {
      return (
        <>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Sending...</Text>
        </>
      );
    }

    if (connectionStatus?.isConnected) {
      return (
        <>
          <CheckCircle size={16} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Connected</Text>
        </>
      );
    }

    if (connectionStatus?.hasPendingRequest) {
      return (
        <>
          <Clock size={16} color="#FFFFFF" />
          <Text style={styles.connectButtonText}>Request Sent</Text>
        </>
      );
    }

    return (
      <>
        <UserPlus size={16} color="#FFFFFF" />
        <Text style={styles.connectButtonText}>Connect</Text>
      </>
    );
  };

  const isConnectButtonDisabled = () => {
    return sendingRequest || 
           connectionStatus?.isConnected || 
           connectionStatus?.hasPendingRequest;
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !userData.profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorText}>{error || 'This user profile could not be loaded.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData(id as string)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const profile = userData.profile;
  const isOwnProfile = profile.id === currentUserProfile?.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Share size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.avatar} />
              {profile.is_public && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={12} color="#FFFFFF" fill="#10B981" />
                </View>
              )}
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.full_name || profile.username}</Text>
              <Text style={styles.userRole}>{profile.role || 'Professional'}</Text>
              <Text style={styles.userCompany}>{profile.company || 'OpenAnts'}</Text>
              
              <View style={styles.statusBadges}>
                {profile.is_public && (
                  <View style={styles.verifiedTag}>
                    <CheckCircle size={12} color="#10B981" />
                    <Text style={styles.verifiedText}>Public Profile</Text>
                  </View>
                )}
                <View style={styles.statusTag}>
                  <Text style={styles.statusEmoji}>🌱</Text>
                  <Text style={styles.statusText}>Open to Connect</Text>
                </View>
              </View>
              
              {profile.direct_messages && (
                <View style={styles.chatTag}>
                  <Text style={styles.chatEmoji}>👋</Text>
                  <Text style={styles.chatText}>Open to chat</Text>
                </View>
              )}
            </View>
          </View>

          {/* Primary Action Buttons - Hide for own profile */}
          {!isOwnProfile && (
            <View style={styles.primaryActions}>
              <TouchableOpacity 
                style={[
                  styles.connectButton, 
                  isConnectButtonDisabled() && styles.connectButtonDisabled
                ]} 
                onPress={handleConnect}
                disabled={isConnectButtonDisabled()}
              >
                {getConnectButtonContent()}
              </TouchableOpacity>
              <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                <Plus size={16} color="#374151" />
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Users size={16} color="#6366F1" />
                <Text style={styles.metricValue}>247</Text>
                <Text style={styles.metricLabel}>Connections</Text>
              </View>
              <View style={styles.metricItem}>
                <UserPlus size={16} color="#3B82F6" />
                <Text style={styles.metricValue}>1.2K</Text>
                <Text style={styles.metricLabel}>Followers</Text>
              </View>
              <View style={styles.metricItem}>
                <Users size={16} color="#10B981" />
                <Text style={styles.metricValue}>8</Text>
                <Text style={styles.metricLabel}>Mutual</Text>
              </View>
            </View>
          </View>

          {/* Location Info */}
          {profile.is_public && profile.last_location_update && (
            <View style={styles.uniqueStats}>
              <View style={styles.statItem}>
                <MapPin size={14} color="#8B5CF6" />
                <Text style={styles.statText}>Last seen: {formatTimestamp(profile.last_location_update)}</Text>
              </View>
              <View style={styles.statItem}>
                <Brain size={14} color="#3B82F6" />
                <Text style={styles.statText}>5 Shared Interests</Text>
              </View>
            </View>
          )}
        </View>

        {/* About Me */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Posts & Activity */}
        {userData.posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts & Activity</Text>
            {userData.posts.slice(0, 3).map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image source={{ uri: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.postAvatar} />
                  <View style={styles.postInfo}>
                    <View style={styles.postNameRow}>
                      <Text style={styles.postName}>{profile.full_name || profile.username}</Text>
                      <Text style={styles.postTimestamp}>{formatTimestamp(post.created_at)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                {post.tags && post.tags.length > 0 && (
                  <View style={styles.postTags}>
                    {post.tags.slice(0, 3).map((tag, tagIndex) => (
                      <View key={tagIndex} style={[
                        styles.postTag,
                        tagIndex === 0 ? styles.bluePostTag : styles.greenPostTag
                      ]}>
                        <Text style={[
                          styles.postTagText,
                          tagIndex === 0 ? styles.bluePostTagText : styles.greenPostTagText
                        ]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postAction}>
                    <Heart size={14} color="#6B7280" />
                    <Text style={styles.postActionText}>{post.likes_count}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <MessageCircle size={14} color="#6B7280" />
                    <Text style={styles.postActionText}>{post.comments_count}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {userData.posts.length > 3 && (
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>Show More Posts</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Work Experience */}
        {userData.experiences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {userData.experiences.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.experienceLogo}>
                  <Building size={20} color="#6366F1" />
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceTitle}>{exp.job_title}</Text>
                  <Text style={styles.experienceCompany}>{exp.company} • {exp.duration}</Text>
                  <Text style={styles.experienceDescription}>{exp.description}</Text>
                  {exp.tags && exp.tags.length > 0 && (
                    <View style={styles.experienceTags}>
                      {exp.tags.map((tag, tagIndex) => (
                        <View key={tagIndex} style={styles.experienceTag}>
                          <Text style={styles.experienceTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {userData.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {userData.education.map((edu) => (
              <View key={edu.id} style={styles.experienceItem}>
                <View style={[styles.experienceLogo, { backgroundColor: '#8B5CF6' }]}>
                  <GraduationCap size={20} color="#FFFFFF" />
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceTitle}>{edu.degree}</Text>
                  <Text style={styles.experienceCompany}>{edu.school} • {edu.start_year} - {edu.end_year}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <SkillTag key={index} skill={skill} />
              ))}
            </View>
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.skillsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Looking For */}
        {profile.looking_for && profile.looking_for.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking to connect on</Text>
            <View style={styles.lookingForContainer}>
              {profile.looking_for.map((item, index) => (
                <View key={index} style={styles.lookingForItem}>
                  <Lightbulb size={16} color="#F59E0B" />
                  <Text style={styles.lookingForText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons - Hide for own profile */}
        {!isOwnProfile && (
          <View style={styles.actionButtonsSection}>
            <View style={styles.primaryActionButtons}>
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <MessageCircle size={16} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waveButton} onPress={handleWave}>
                <Hand size={16} color="#FFFFFF" />
                <Text style={styles.waveButtonText}>Wave</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.moreActionsButton}
              onPress={() => setShowActionModal(true)}
            >
              <Text style={styles.moreActionsText}>More Actions</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ActionModal />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  userCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#1D4ED8',
  },
  chatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  chatEmoji: {
    fontSize: 12,
  },
  chatText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  connectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  followButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  followButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  metricsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  uniqueStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  postNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  postTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  postTags: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  postTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bluePostTag: {
    backgroundColor: '#DBEAFE',
  },
  greenPostTag: {
    backgroundColor: '#D1FAE5',
  },
  postTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  bluePostTagText: {
    color: '#1D4ED8',
  },
  greenPostTagText: {
    color: '#059669',
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  experienceLogo: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  experienceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  experienceTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  experienceTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  interestTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  lookingForContainer: {
    gap: 8,
  },
  lookingForItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lookingForText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  actionButtonsSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  primaryActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  waveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  waveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  moreActionsButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  moreActionsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  actionModalContent: {
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
    marginBottom: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionItem: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});