import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  MoreVertical, 
  CheckCircle, 
  Users, 
  Heart, 
  Eye, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Building,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Briefcase,
  Award,
  Target,
  Clock,
  Share,
  MessageCircle,
  UserPlus,
  Settings
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import EducationForm from '@/components/EducationForm';

type UserEducation = Database['public']['Tables']['user_education']['Row'];

// Enhanced user data with more comprehensive information
const getUserData = () => ({
  id: 'current-user',
  name: 'Sarah Mitchell',
  role: 'Senior Product Designer',
  company: 'Figma',
  image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  coverImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  verified: true,
  status: 'Open to Collaborate',
  openToChat: true,
  bio: 'Passionate product designer with 6+ years crafting user-centered experiences for SaaS products. I believe great design solves real problems while being delightfully simple. Currently exploring AI-powered design tools and mentoring junior designers.',
  metrics: {
    connections: 247,
    followers: '1.3K',
    views: 89,
    liveMatches: 32,
    locations: 9,
    crossedPaths: 156
  },
  experience: [
    {
      title: 'Senior Product Designer',
      company: 'Figma',
      duration: '2022 - Present',
      logo: 'F',
      color: '#F24E1E',
      description: 'Leading design for collaboration features used by 4M+ users',
      tags: ['#ProductStrategy', '#Design', '#Leadership']
    },
    {
      title: 'UX Designer',
      company: 'Adobe',
      duration: '2020 - 2022',
      logo: 'A',
      color: '#FF0000',
      description: 'Designed creative tools for digital artists',
      tags: ['#CreativeTools', '#UX']
    }
  ],
  skills: [
    { name: 'UI/UX Design', color: '#3B82F6', level: 95 },
    { name: 'Product Strategy', color: '#8B5CF6', level: 88 },
    { name: 'User Research', color: '#10B981', level: 92 },
    { name: 'Prototyping', color: '#F59E0B', level: 85 },
    { name: 'Design Systems', color: '#EF4444', level: 90 },
    { name: 'Mentoring', color: '#6366F1', level: 87 }
  ],
  goals: [
    { text: 'Collaboration Partners', icon: UserPlus, color: '#6366F1' },
    { text: 'Mentorship Opportunities', icon: Award, color: '#10B981' },
    { text: 'Speaking Engagements', icon: MessageCircle, color: '#F59E0B' }
  ],
  interests: ['#FinTech', '#HealthTech', '#EdTech', '#AI/ML'],
  portfolio: [
    {
      title: 'Design System 2.0',
      description: 'Component library redesign',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#3B82F6', '#8B5CF6']
    },
    {
      title: 'Mobile App Redesign',
      description: 'E-commerce platform',
      image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#10B981', '#3B82F6']
    },
    {
      title: 'Dashboard Analytics',
      description: 'B2B SaaS product',
      image: 'https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#F59E0B', '#EF4444']
    }
  ],
  posts: [
    {
      content: 'Just wrapped up an incredible design sprint at Tech Summit! The energy around AI-powered design tools was amazing. Can\'t wait to implement some of these ideas 🚀',
      timestamp: '2d ago',
      likes: 12,
      comments: 3,
      tags: ['#DesignSprint', '#AIDesign']
    }
  ],
  privacy: {
    publicMode: true,
    proximityAlerts: true,
    directMessages: false
  }
});

export default function ProfileScreen() {
  const { user, profile, loading: authLoading } = useAuth();
  const [educationList, setEducationList] = useState<UserEducation[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [showEditMode, setShowEditMode] = useState(false);
  
  // Use refs to prevent unnecessary re-fetching
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const userData = getUserData();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // COMPLETELY REWRITTEN fetch function - removed ALL problematic caching logic
  const fetchEducationData = useCallback(async (userId: string, forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('🚫 Fetch already in progress, skipping...');
      return;
    }

    isFetchingRef.current = true;
    setEducationLoading(true);
    setEducationError(null);

    try {
      console.log('🔄 Fetching education data for user:', userId, forceRefresh ? '(FORCED REFRESH)' : '(NORMAL FETCH)');
      
      const { data, error } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', userId)
        .order('start_year', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        console.error('❌ Error fetching education:', error);
        setEducationError(`Failed to load education data: ${error.message}`);
        setEducationList([]); // Clear any stale data
      } else {
        console.log('✅ Education data fetched successfully:', data?.length || 0, 'records');
        console.log('📋 Education data:', data);
        setEducationList(data || []);
        setEducationError(null); // Clear any previous errors
      }
    } catch (error: any) {
      console.error('💥 Unexpected error fetching education:', error);
      if (mountedRef.current) {
        setEducationError(`Unexpected error: ${error.message}`);
        setEducationList([]); // Clear any stale data
      }
    } finally {
      if (mountedRef.current) {
        setEducationLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []); // No dependencies - this function is now completely independent

  // Simple initial fetch on user change
  useEffect(() => {
    if (!authLoading && user && !isFetchingRef.current) {
      console.log('🚀 Initial education fetch for user:', user.id);
      fetchEducationData(user.id);
    } else if (!authLoading && !user) {
      console.log('🚫 No authenticated user, clearing education data');
      setEducationList([]);
      setEducationLoading(false);
      setEducationError(null);
    }
  }, [user, authLoading, fetchEducationData]);

  const handleEducationSuccess = (newEducation: UserEducation) => {
    console.log('✅ New education added:', newEducation);
    
    // STEP 1: Immediately update local state for instant UI feedback
    setEducationList(prev => {
      const updated = [newEducation, ...prev];
      return updated.sort((a, b) => parseInt(b.start_year) - parseInt(a.start_year));
    });
    
    // STEP 2: Close the form
    setShowEditMode(false);
    
    // STEP 3: Force refresh to sync with server (this will now ALWAYS work)
    if (user) {
      console.log('🔄 Force refreshing education data after successful add...');
      setTimeout(() => {
        fetchEducationData(user.id, true); // This will now always fetch
      }, 300);
    }
  };

  const handleEducationCancel = () => {
    setShowEditMode(false);
  };

  const handleDeleteEducation = async (educationId: string) => {
    Alert.alert(
      'Delete Education',
      'Are you sure you want to delete this education record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting education record:', educationId);
              
              const { error } = await supabase
                .from('user_education')
                .delete()
                .eq('id', educationId);

              if (error) {
                console.error('❌ Error deleting education:', error);
                Alert.alert('Error', 'Failed to delete education record');
              } else {
                console.log('✅ Education record deleted successfully');
                // Remove from local state
                setEducationList(prev => prev.filter(edu => edu.id !== educationId));
                Alert.alert('Success', 'Education record deleted successfully');
                
                // Force refresh to ensure consistency
                if (user) {
                  setTimeout(() => {
                    fetchEducationData(user.id, true);
                  }, 300);
                }
              }
            } catch (error) {
              console.error('💥 Unexpected error deleting education:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const handleManualRefresh = async () => {
    if (!user) return;
    
    console.log('🔄 Manual refresh triggered');
    // This will now always work since we removed the caching logic
    await fetchEducationData(user.id, true);
  };

  const handleBack = () => {
    router.back();
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please sign in to view your profile</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const MetricCard = ({ icon: Icon, value, label, color = '#6366F1' }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricIconContainer}>
        <Icon size={16} color={color} />
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const SkillBar = ({ skill }) => (
    <View style={styles.skillContainer}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillName}>{skill.name}</Text>
        <Text style={styles.skillPercentage}>{skill.level}%</Text>
      </View>
      <View style={styles.skillBarBackground}>
        <View 
          style={[
            styles.skillBarFill, 
            { width: `${skill.level}%`, backgroundColor: skill.color }
          ]} 
        />
      </View>
    </View>
  );

  const PortfolioCard = ({ project, index }) => (
    <View style={styles.portfolioCard}>
      <LinearGradient
        colors={project.gradient}
        style={styles.portfolioGradient}
      >
        <View style={styles.portfolioOverlay} />
      </LinearGradient>
      <View style={styles.portfolioContent}>
        <Text style={styles.portfolioTitle}>{project.title}</Text>
        <Text style={styles.portfolioDescription}>{project.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MoreVertical size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Section */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.coverSection}
        >
          <View style={styles.profileHeaderContent}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userData.image }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color="#FFFFFF" fill="#10B981" />
              </View>
            </View>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userRole}>{userData.role} at {userData.company}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{userData.status}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Metrics Grid */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricCard icon={Users} value={userData.metrics.connections} label="Connections" color="#6366F1" />
            <MetricCard icon={Heart} value={userData.metrics.followers} label="Followers" color="#EF4444" />
            <MetricCard icon={Eye} value={userData.metrics.views} label="Views (Week)" color="#3B82F6" />
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard icon={TrendingUp} value={userData.metrics.liveMatches} label="Live Matches" color="#10B981" />
            <MetricCard icon={MapPin} value={userData.metrics.locations} label="Locations" color="#F59E0B" />
            <MetricCard icon={Users} value={userData.metrics.crossedPaths} label="Crossed Paths" color="#8B5CF6" />
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{userData.bio}</Text>
        </View>

        {/* Posts & Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posts & Activity</Text>
            <TouchableOpacity style={styles.createPostButton}>
              <Text style={styles.createPostText}>Create Post</Text>
            </TouchableOpacity>
          </View>
          
          {userData.posts.map((post, index) => (
            <View key={index} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: userData.image }} style={styles.postAvatar} />
                <View style={styles.postInfo}>
                  <View style={styles.postNameRow}>
                    <Text style={styles.postName}>{userData.name}</Text>
                    <Text style={styles.postTimestamp}>{post.timestamp}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postTags}>
                {post.tags.map((tag, tagIndex) => (
                  <View key={tagIndex} style={[
                    styles.postTag,
                    tagIndex === 0 ? styles.bluePostTag : styles.purplePostTag
                  ]}>
                    <Text style={[
                      styles.postTagText,
                      tagIndex === 0 ? styles.bluePostTagText : styles.purplePostTagText
                    ]}>{tag}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postAction}>
                  <Heart size={14} color="#6B7280" />
                  <Text style={styles.postActionText}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <MessageCircle size={14} color="#6B7280" />
                  <Text style={styles.postActionText}>{post.comments}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.showMoreButton}>
            <Text style={styles.showMoreText}>Show More Posts</Text>
          </TouchableOpacity>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {userData.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={[styles.experienceLogo, { backgroundColor: exp.color }]}>
                <Text style={styles.experienceLogoText}>{exp.logo}</Text>
              </View>
              <View style={styles.experienceInfo}>
                <Text style={styles.experienceTitle}>{exp.title}</Text>
                <Text style={styles.experienceCompany}>{exp.company} • {exp.duration}</Text>
                <Text style={styles.experienceDescription}>{exp.description}</Text>
                {exp.tags.length > 0 && (
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

        {/* Education - COMPLETELY FIXED */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.educationActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleManualRefresh}
                disabled={educationLoading}
              >
                <RefreshCw size={16} color="#6366F1" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setShowEditMode(!showEditMode)}
              >
                <Plus size={16} color="#6366F1" />
                <Text style={styles.editButtonText}>
                  {showEditMode ? 'Cancel' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Add Education Form */}
          {showEditMode && (
            <EducationForm
              onSuccess={handleEducationSuccess}
              onCancel={handleEducationCancel}
            />
          )}
          
          {/* Error State */}
          {educationError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {educationError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleManualRefresh}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Loading State */}
          {educationLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading education data...</Text>
              <Text style={styles.debugText}>
                User ID: {user?.id || 'None'}
              </Text>
            </View>
          )}

          {/* Education List */}
          {!educationError && !educationLoading && (
            <>
              {educationList.length > 0 ? (
                educationList.map((education) => (
                  <View key={education.id} style={styles.educationItem}>
                    <View style={[styles.experienceLogo, { backgroundColor: '#8B5CF6' }]}>
                      <GraduationCap size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.experienceInfo}>
                      <Text style={styles.experienceTitle}>{education.degree}</Text>
                      <Text style={styles.experienceCompany}>
                        {education.school} • {education.start_year} - {education.end_year}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEducation(education.id)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <GraduationCap size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No education added yet</Text>
                  <Text style={styles.emptySubtext}>Tap "Add" to add your first education record</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Skills & Expertise */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {userData.skills.map((skill, index) => (
            <SkillBar key={index} skill={skill} />
          ))}
          
          <View style={styles.endorsementInfo}>
            <Text style={styles.endorsementText}>
              <Text style={styles.endorsementNumber}>12 endorsements</Text> from connections
            </Text>
          </View>
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity style={styles.editButton}>
              <Edit3 size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit Project</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.portfolioGrid}>
            {userData.portfolio.map((project, index) => (
              <PortfolioCard key={index} project={project} index={index} />
            ))}
            
            <TouchableOpacity style={styles.addPortfolioCard}>
              <Plus size={24} color="#9CA3AF" />
              <Text style={styles.addPortfolioText}>Add Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals & Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Interests</Text>
          
          <View style={styles.goalsContainer}>
            <View style={styles.goalCategory}>
              <View style={styles.goalHeader}>
                <Target size={16} color="#6366F1" />
                <Text style={styles.goalCategoryTitle}>Looking For</Text>
              </View>
              <View style={styles.goalTags}>
                {userData.goals.map((goal, index) => {
                  const IconComponent = goal.icon;
                  return (
                    <View key={index} style={[styles.goalTag, { backgroundColor: `${goal.color}20` }]}>
                      <IconComponent size={14} color={goal.color} />
                      <Text style={[styles.goalTagText, { color: goal.color }]}>{goal.text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.goalCategory}>
              <View style={styles.goalHeader}>
                <Building size={16} color="#6366F1" />
                <Text style={styles.goalCategoryTitle}>Industries of Interest</Text>
              </View>
              <View style={styles.goalTags}>
                {userData.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Activity Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Insights</Text>
          
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <Calendar size={16} color="#3B82F6" />
                <Text style={styles.insightValue}>6</Text>
              </View>
              <Text style={styles.insightLabel}>Events Attended</Text>
            </View>
            
            <View style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <MapPin size={16} color="#10B981" />
                <Text style={styles.insightValue}>9</Text>
              </View>
              <Text style={styles.insightLabel}>Locations Active</Text>
            </View>
          </View>
          
          <View style={styles.lastActiveCard}>
            <Clock size={16} color="#6366F1" />
            <View style={styles.lastActiveInfo}>
              <Text style={styles.lastActiveTitle}>Last Public Mode</Text>
              <Text style={styles.lastActiveSubtitle}>Tech Summit – April 2025</Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility & Privacy</Text>
          
          <View style={styles.privacySettings}>
            <View style={styles.privacySetting}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Public Mode</Text>
                <Text style={styles.privacyDescription}>Show your profile to nearby professionals</Text>
              </View>
              <Switch
                value={userData.privacy.publicMode}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.privacySetting}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Proximity Alerts</Text>
                <Text style={styles.privacyDescription}>Get notified about relevant connections nearby</Text>
              </View>
              <Switch
                value={userData.privacy.proximityAlerts}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            <View style={styles.privacySetting}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Direct Messages</Text>
                <Text style={styles.privacyDescription}>Allow others to message you directly</Text>
              </View>
              <Switch
                value={userData.privacy.directMessages}
                onValueChange={() => {}}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  coverSection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  metricsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 24,
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
  createPostButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createPostText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  educationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  bioText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  postCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
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
    marginBottom: 12,
  },
  postTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  postTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bluePostTag: {
    backgroundColor: '#DBEAFE',
  },
  purplePostTag: {
    backgroundColor: '#F3E8FF',
  },
  postTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  bluePostTagText: {
    color: '#1D4ED8',
  },
  purplePostTagText: {
    color: '#7C3AED',
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
    marginBottom: 16,
  },
  experienceLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  experienceLogoText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 16,
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
    color: '#9CA3AF',
    marginBottom: 8,
  },
  experienceTags: {
    flexDirection: 'row',
    gap: 6,
  },
  experienceTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  experienceTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  skillContainer: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  skillPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  skillBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  skillBarFill: {
    height: 6,
    borderRadius: 3,
  },
  endorsementInfo: {
    marginTop: 8,
  },
  endorsementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  endorsementNumber: {
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  portfolioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  portfolioContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  portfolioTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  portfolioDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addPortfolioCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPortfolioText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  goalsContainer: {
    gap: 24,
  },
  goalCategory: {
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalCategoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  goalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  goalTagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestTagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  insightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  insightLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  lastActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  lastActiveInfo: {
    flex: 1,
  },
  lastActiveTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginBottom: 2,
  },
  lastActiveSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#3B82F6',
  },
  privacySettings: {
    gap: 16,
  },
  privacySetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});