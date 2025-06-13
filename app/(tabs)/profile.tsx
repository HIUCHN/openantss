import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share, MoveVertical as MoreVertical, CircleCheck as CheckCircle, UserPlus, Plus, Users, MapPin, Brain, Calendar, Clock, Heart, MessageCircle, Handshake, Lightbulb, Bookmark, Hand, Building, GraduationCap, Hash as Hashtag, Image as ImageIcon, Smartphone, Edit } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type UserEducation = Database['public']['Tables']['user_education']['Row'];
type UserEducationInsert = Database['public']['Tables']['user_education']['Insert'];

// Mock user data - in a real app, this would come from your API
const getUserData = () => ({
  id: 'current-user',
  name: 'Alex Chen',
  role: 'Senior Product Designer',
  company: 'Spotify',
  image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  verified: true,
  status: 'Open to Collaborate',
  openToChat: true,
  bio: 'Product designer passionate about AI and sustainability. Looking to connect with founders and innovators in edtech to create meaningful learning experiences.',
  metrics: {
    connections: 247,
    followers: '1.2K',
    mutual: 8
  },
  location: {
    current: 'Currently Active',
    publicMode: true,
    lastSeen: 'Campus Cafe, Tech Hub London',
    sharedInterests: 5,
    eventsAttended: 3,
    lastSeenTime: '2 days ago'
  },
  experience: [
    {
      title: 'Senior Product Designer',
      company: 'Spotify',
      duration: '2022 - Present',
      logo: 'S',
      color: '#1DB954',
      tags: ['#SaaS', '#Music']
    },
    {
      title: 'UX Designer',
      company: 'Adobe',
      duration: '2020 - 2022',
      logo: 'A',
      color: '#FF0000',
      tags: []
    }
  ],
  skills: [
    { name: '#UI/UX', color: 'blue' },
    { name: '#Figma', color: 'purple' },
    { name: '#DesignSystems', color: 'green' },
    { name: '#Prototyping', color: 'orange' },
    { name: '#UserResearch', color: 'pink' },
    { name: '#Leadership', color: 'indigo' }
  ],
  lookingFor: [
    { text: 'Startup collaborations', icon: Handshake, color: '#10B981' },
    { text: 'Mentorship', icon: Users, color: '#3B82F6' },
    { text: 'Finding co-founders', icon: Lightbulb, color: '#F59E0B' }
  ],
  portfolio: [
    { title: 'Design System', icon: ImageIcon },
    { title: 'Mobile App', icon: Smartphone }
  ],
  availability: {
    status: 'Available to meet now',
    duration: 'Free for the next 2 hours',
    available: true
  },
  mutualInterests: {
    tags: ['ClimateTech', 'RemoteWork'],
    events: ['Startup Grind Edinburgh 2025']
  },
  posts: [
    {
      content: 'Just wrapped up an amazing design sprint at Tech Hub London! 🚀 Working on sustainable UX patterns for climate tech startups.',
      timestamp: '2 days ago',
      likes: 12,
      comments: 3,
      tags: ['#DesignSprint', '#ClimateTech']
    }
  ]
});

export default function ProfileScreen() {
  const { user, profile, loading: authLoading } = useAuth();
  const [educationList, setEducationList] = useState<UserEducation[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // Form state - using individual state variables to prevent re-render issues
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  // Refs for TextInputs to maintain focus
  const schoolInputRef = useRef<TextInput>(null);
  const degreeInputRef = useRef<TextInput>(null);
  const startYearInputRef = useRef<TextInput>(null);
  const endYearInputRef = useRef<TextInput>(null);

  const userData = getUserData();

  // Fetch education data when user is available (only once)
  useEffect(() => {
    if (!authLoading && user && !hasFetchedRef.current) {
      fetchEducationData();
      hasFetchedRef.current = true;
    }
  }, [user, authLoading]);

  const fetchEducationData = async () => {
    if (!user) return;

    try {
      setEducationLoading(true);
      
      const { data, error } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });

      if (error) {
        console.error('Error fetching education data:', error);
        // Don't show error for empty results
        if (error.code !== 'PGRST116') {
          Alert.alert('Error', 'Failed to load education data');
        }
      } else {
        setEducationList(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching education:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading education data');
    } finally {
      setEducationLoading(false);
    }
  };

  const clearForm = () => {
    setSchool('');
    setDegree('');
    setStartYear('');
    setEndYear('');
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!school.trim() || !degree.trim() || !startYear.trim() || !endYear.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    // Basic year validation
    const startYearNum = parseInt(startYear);
    const endYearNum = parseInt(endYear);
    const currentYear = new Date().getFullYear();

    if (isNaN(startYearNum) || isNaN(endYearNum)) {
      Alert.alert('Validation Error', 'Please enter valid years');
      return;
    }

    if (startYearNum < 1900 || startYearNum > currentYear + 10) {
      Alert.alert('Validation Error', 'Please enter a valid start year');
      return;
    }

    if (endYearNum < startYearNum || endYearNum > currentYear + 10) {
      Alert.alert('Validation Error', 'End year must be after start year and not too far in the future');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please sign in again to continue');
      return;
    }

    try {
      setSubmitting(true);

      const newEducation: UserEducationInsert = {
        user_id: user.id,
        school: school.trim(),
        degree: degree.trim(),
        start_year: startYear.trim(),
        end_year: endYear.trim()
      };

      const { data, error } = await supabase
        .from('user_education')
        .insert(newEducation)
        .select()
        .single();

      if (error) {
        console.error('Error inserting education:', error);
        Alert.alert('Error', 'Failed to add education record. Please try again.');
      } else if (data) {
        // Add the new record to the list (sorted by start_year desc)
        setEducationList(prev => {
          const updated = [data, ...prev];
          return updated.sort((a, b) => parseInt(b.start_year) - parseInt(a.start_year));
        });
        
        // Clear form and hide edit mode
        clearForm();
        setShowEditMode(false);
        
        Alert.alert('Success!', 'Education record added successfully!');
      }
    } catch (error) {
      console.error('Unexpected error with education:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    setShowEditMode(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleConnect = () => {
    console.log('Sending connection request to', userData.name);
  };

  const handleFollow = () => {
    console.log('Following', userData.name);
  };

  const handleMessage = () => {
    console.log('Messaging', userData.name);
  };

  const handleWave = () => {
    console.log('Waving to', userData.name);
  };

  const SkillTag = ({ skill }) => {
    const colorMap = {
      blue: { bg: '#DBEAFE', text: '#1D4ED8' },
      purple: { bg: '#F3E8FF', text: '#7C3AED' },
      green: { bg: '#D1FAE5', text: '#059669' },
      orange: { bg: '#FED7AA', text: '#EA580C' },
      pink: { bg: '#FCE7F3', text: '#BE185D' },
      indigo: { bg: '#E0E7FF', text: '#4338CA' }
    };
    
    const colors = colorMap[skill.color] || colorMap.blue;
    
    return (
      <View style={[styles.skillTag, { backgroundColor: colors.bg }]}>
        <Text style={[styles.skillText, { color: colors.text }]}>{skill.name}</Text>
      </View>
    );
  };

  const AddEducationForm = () => (
    <View style={styles.addEducationForm}>
      <Text style={styles.formTitle}>Add Education</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>School or University *</Text>
        <TextInput
          ref={schoolInputRef}
          style={[styles.formInput, submitting && styles.formInputDisabled]}
          placeholder="e.g., Harvard University"
          value={school}
          onChangeText={setSchool}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => degreeInputRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Degree *</Text>
        <TextInput
          ref={degreeInputRef}
          style={[styles.formInput, submitting && styles.formInputDisabled]}
          placeholder="e.g., Bachelor of Science in Computer Science"
          value={degree}
          onChangeText={setDegree}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => startYearInputRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.yearRow}>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>Start Year *</Text>
          <TextInput
            ref={startYearInputRef}
            style={[styles.formInput, submitting && styles.formInputDisabled]}
            placeholder="2018"
            value={startYear}
            onChangeText={setStartYear}
            keyboardType="numeric"
            maxLength={4}
            editable={!submitting}
            returnKeyType="next"
            onSubmitEditing={() => endYearInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>End Year *</Text>
          <TextInput
            ref={endYearInputRef}
            style={[styles.formInput, submitting && styles.formInputDisabled]}
            placeholder="2022"
            value={endYear}
            onChangeText={setEndYear}
            keyboardType="numeric"
            maxLength={4}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            blurOnSubmit={true}
          />
        </View>
      </View>
      
      <View style={styles.formActions}>
        <TouchableOpacity 
          style={[styles.cancelButton, submitting && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Add Education</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
              <Image source={{ uri: userData.image }} style={styles.avatar} />
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color="#FFFFFF" fill="#10B981" />
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.userRole}>{userData.role}</Text>
              <Text style={styles.userCompany}>{userData.company}</Text>
              
              <View style={styles.statusBadges}>
                <View style={styles.verifiedTag}>
                  <CheckCircle size={12} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <View style={styles.statusTag}>
                  <Text style={styles.statusEmoji}>🌱</Text>
                  <Text style={styles.statusText}>{userData.status}</Text>
                </View>
              </View>
              
              {userData.openToChat && (
                <View style={styles.chatTag}>
                  <Text style={styles.chatEmoji}>👋</Text>
                  <Text style={styles.chatText}>Open to chat now</Text>
                </View>
              )}
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.primaryActions}>
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
              <Plus size={16} color="#374151" />
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Users size={16} color="#6366F1" />
                <Text style={styles.metricValue}>{userData.metrics.connections}</Text>
                <Text style={styles.metricLabel}>Connections</Text>
              </View>
              <View style={styles.metricItem}>
                <UserPlus size={16} color="#3B82F6" />
                <Text style={styles.metricValue}>{userData.metrics.followers}</Text>
                <Text style={styles.metricLabel}>Followers</Text>
              </View>
              <View style={styles.metricItem}>
                <Users size={16} color="#10B981" />
                <Text style={styles.metricValue}>{userData.metrics.mutual}</Text>
                <Text style={styles.metricLabel}>Mutual</Text>
              </View>
            </View>
          </View>

          {/* Connectly Unique Stats */}
          <View style={styles.uniqueStats}>
            <View style={styles.statItem}>
              <MapPin size={14} color="#8B5CF6" />
              <Text style={styles.statText}>Seen at: {userData.location.lastSeen}</Text>
            </View>
            <View style={styles.statItem}>
              <Brain size={14} color="#3B82F6" />
              <Text style={styles.statText}>{userData.location.sharedInterests} Shared Interests</Text>
            </View>
            <View style={styles.statItem}>
              <Calendar size={14} color="#10B981" />
              <Text style={styles.statText}>Attended {userData.location.eventsAttended} events with you</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={14} color="#F59E0B" />
              <Text style={styles.statText}>Last seen: {userData.location.lastSeenTime} (Public Mode)</Text>
            </View>
          </View>
        </View>

        {/* Location & Visibility */}
        <View style={styles.section}>
          <View style={styles.locationInfo}>
            <View style={styles.locationLeft}>
              <MapPin size={16} color="#6366F1" />
              <Text style={styles.locationText}>{userData.location.current}</Text>
            </View>
            <View style={styles.publicModeTag}>
              <Text style={styles.publicModeText}>Public Mode On</Text>
            </View>
          </View>
        </View>

        {/* About Me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{userData.bio}</Text>
        </View>

        {/* Posts & Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts & Activity</Text>
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
                    tagIndex === 0 ? styles.bluePostTag : styles.greenPostTag
                  ]}>
                    <Text style={[
                      styles.postTagText,
                      tagIndex === 0 ? styles.bluePostTagText : styles.greenPostTagText
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
            <Text style={styles.showMoreText}>Show More</Text>
          </TouchableOpacity>
        </View>

        {/* Work Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {userData.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={[styles.experienceLogo, { backgroundColor: exp.color }]}>
                <Text style={styles.experienceLogoText}>{exp.logo}</Text>
              </View>
              <View style={styles.experienceInfo}>
                <Text style={styles.experienceTitle}>{exp.title}</Text>
                <Text style={styles.experienceCompany}>{exp.company} • {exp.duration}</Text>
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

        {/* Education - Supabase Integration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditMode(!showEditMode)}
            >
              <Edit size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {/* Add Education Form */}
          {showEditMode && <AddEducationForm />}
          
          {/* Loading State */}
          {educationLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading education data...</Text>
            </View>
          )}

          {/* Education List */}
          {!educationLoading && (
            <>
              {educationList.length > 0 ? (
                educationList.map((education) => (
                  <View key={education.id} style={styles.educationItem}>
                    <View style={[styles.experienceLogo, { backgroundColor: '#8B5CF6' }]}>
                      <Text style={styles.experienceLogoText}>
                        {education.school.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.experienceInfo}>
                      <Text style={styles.experienceTitle}>{education.degree}</Text>
                      <Text style={styles.experienceCompany}>{education.school} • {education.start_year} - {education.end_year}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <GraduationCap size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No education added yet</Text>
                  <Text style={styles.emptySubtext}>Tap "Edit" to add your first education record</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {userData.skills.map((skill, index) => (
              <SkillTag key={index} skill={skill} />
            ))}
          </View>
        </View>

        {/* Looking to connect on */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Looking to connect on</Text>
          <View style={styles.lookingForContainer}>
            {userData.lookingFor.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <View key={index} style={styles.lookingForItem}>
                  <IconComponent size={16} color={item.color} />
                  <Text style={styles.lookingForText}>{item.text}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <View style={styles.portfolioGrid}>
            {userData.portfolio.map((project, index) => {
              const IconComponent = project.icon;
              return (
                <View key={index} style={styles.portfolioItem}>
                  <View style={styles.portfolioIcon}>
                    <IconComponent size={24} color="#9CA3AF" />
                  </View>
                  <Text style={styles.portfolioTitle}>{project.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={[
            styles.availabilityCard,
            userData.availability.available ? styles.availableCard : styles.unavailableCard
          ]}>
            <View style={styles.availabilityHeader}>
              <View style={[
                styles.availabilityDot,
                { backgroundColor: userData.availability.available ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={[
                styles.availabilityStatus,
                { color: userData.availability.available ? '#065F46' : '#991B1B' }
              ]}>
                {userData.availability.status}
              </Text>
            </View>
            <Text style={[
              styles.availabilityDuration,
              { color: userData.availability.available ? '#059669' : '#DC2626' }
            ]}>
              {userData.availability.duration}
            </Text>
          </View>
        </View>

        {/* Mutual Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You both share</Text>
          <View style={styles.mutualContainer}>
            <View style={styles.mutualItem}>
              <Hashtag size={14} color="#3B82F6" />
              <Text style={styles.mutualText}>{userData.mutualInterests.tags.join(', ')}</Text>
            </View>
            <View style={styles.mutualItem}>
              <Calendar size={14} color="#8B5CF6" />
              <Text style={styles.mutualText}>{userData.mutualInterests.events.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
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
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  publicModeTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicModeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#059669',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  experienceLogoText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
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
  experienceTags: {
    flexDirection: 'row',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
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
    marginBottom: 12,
  },
  addEducationForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  formInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  yearRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yearGroup: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
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
  portfolioGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  portfolioItem: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioIcon: {
    marginBottom: 8,
  },
  portfolioTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  availabilityCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  availableCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  unavailableCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  availabilityDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  mutualContainer: {
    gap: 8,
  },
  mutualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutualText: {
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
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
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
  bottomPadding: {
    height: 100,
  },
});