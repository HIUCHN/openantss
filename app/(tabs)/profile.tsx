import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard as Edit, Plus, Trash2, MapPin, Calendar, Users, Eye, Heart, MessageCircle, Share, MoveHorizontal as MoreHorizontal, GraduationCap, Briefcase, Settings, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import EducationForm from '@/components/EducationForm';
import ExperienceForm from '@/components/ExperienceForm';
import AccountSettingsModal from '@/components/AccountSettingsModal';

type UserEducation = Database['public']['Tables']['user_education']['Row'];
type Experience = Database['public']['Tables']['experiences']['Row'];

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [userEducation, setUserEducation] = useState<UserEducation[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingEducation, setLoadingEducation] = useState(true);
  const [loadingExperiences, setLoadingExperiences] = useState(true);
  const [deletingEducationId, setDeletingEducationId] = useState<string | null>(null);
  const [deletingExperienceId, setDeletingExperienceId] = useState<string | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Fetch user education data
  useEffect(() => {
    if (user) {
      fetchUserEducation();
      fetchExperiences();
    }
  }, [user]);

  const fetchUserEducation = async () => {
    if (!user) return;
    
    try {
      setLoadingEducation(true);
      console.log('📚 Fetching education data for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_education')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });

      if (error) {
        console.error('❌ Error fetching education:', error);
        Alert.alert('Error', 'Failed to load education data');
      } else {
        console.log('✅ Education data fetched:', data);
        setUserEducation(data || []);
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching education:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading education data');
    } finally {
      setLoadingEducation(false);
    }
  };

  const fetchExperiences = async () => {
    if (!user) return;
    
    try {
      setLoadingExperiences(true);
      console.log('💼 Fetching experiences for user:', user.id);
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching experiences:', error);
        Alert.alert('Error', 'Failed to load experience data');
      } else {
        console.log('✅ Experiences fetched:', data);
        setExperiences(data || []);
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching experiences:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading experience data');
    } finally {
      setLoadingExperiences(false);
    }
  };

  const handleEducationAdded = (newEducation: UserEducation) => {
    setUserEducation(prev => [newEducation, ...prev]);
    setShowEducationForm(false);
  };

  const handleExperienceAdded = (newExperience: Experience) => {
    if (editingExperience) {
      // Update existing experience
      setExperiences(prev => prev.map(exp => 
        exp.id === editingExperience.id ? newExperience : exp
      ));
      setEditingExperience(null);
    } else {
      // Add new experience
      setExperiences(prev => [newExperience, ...prev]);
    }
    setShowExperienceForm(false);
  };

  const handleDeleteEducation = async (educationId: string) => {
    Alert.alert(
      'Delete Education',
      'Are you sure you want to delete this education record? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingEducationId(educationId);
              console.log('🗑️ Deleting education record:', educationId);

              const { error } = await supabase
                .from('user_education')
                .delete()
                .eq('id', educationId)
                .eq('user_id', user?.id); // Extra security check

              if (error) {
                console.error('❌ Error deleting education:', error);
                Alert.alert('Error', 'Failed to delete education record. Please try again.');
              } else {
                console.log('✅ Education record deleted successfully');
                // Remove from local state
                setUserEducation(prev => prev.filter(edu => edu.id !== educationId));
                Alert.alert('Success', 'Education record deleted successfully');
              }
            } catch (error) {
              console.error('💥 Unexpected error deleting education:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setDeletingEducationId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteExperience = async (experienceId: string) => {
    Alert.alert(
      'Delete Experience',
      'Are you sure you want to delete this experience record? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingExperienceId(experienceId);
              console.log('🗑️ Deleting experience record:', experienceId);

              const { error } = await supabase
                .from('experiences')
                .delete()
                .eq('id', experienceId)
                .eq('user_id', user?.id); // Extra security check

              if (error) {
                console.error('❌ Error deleting experience:', error);
                Alert.alert('Error', 'Failed to delete experience record. Please try again.');
              } else {
                console.log('✅ Experience record deleted successfully');
                // Remove from local state
                setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
                Alert.alert('Success', 'Experience record deleted successfully');
              }
            } catch (error) {
              console.error('💥 Unexpected error deleting experience:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setDeletingExperienceId(null);
            }
          },
        },
      ]
    );
  };

  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setShowExperienceForm(true);
  };

  const handleCancelExperienceForm = () => {
    setEditingExperience(null);
    setShowExperienceForm(false);
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleProfilePress}>
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.profileHeader}
        >
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer}>
              <Image 
                source={{ uri: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.avatar} 
              />
              <View style={styles.editAvatarButton}>
                <Edit size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              <TouchableOpacity style={styles.editableField}>
                <Text style={styles.userName}>{profile.full_name || 'Add your name'}</Text>
                <Edit size={16} color="#FFFFFF80" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.editableField}>
                <Text style={styles.userRole}>
                  {profile.role && profile.company 
                    ? `${profile.role} at ${profile.company}` 
                    : 'Add your role and company'
                  }
                </Text>
                <Edit size={14} color="#FFFFFF60" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.collaborationTag}>
                <Text style={styles.collaborationText}>Open to Collaborate</Text>
                <Edit size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Users size={16} color="#FFFFFF" />
                <Text style={styles.metricValue}>247</Text>
                <Text style={styles.metricLabel}>Connections</Text>
              </View>
              <View style={styles.metricItem}>
                <Users size={16} color="#FFFFFF" />
                <Text style={styles.metricValue}>1.2K</Text>
                <Text style={styles.metricLabel}>Followers</Text>
              </View>
              <View style={styles.metricItem}>
                <Eye size={16} color="#FFFFFF" />
                <Text style={styles.metricValue}>3.4K</Text>
                <Text style={styles.metricLabel}>Views</Text>
              </View>
              <View style={styles.metricItem}>
                <Heart size={16} color="#FFFFFF" />
                <Text style={styles.metricValue}>89%</Text>
                <Text style={styles.metricLabel}>Like Matches</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* About Me Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <TouchableOpacity style={styles.editButton}>
              <Edit size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          <Text style={styles.aboutText}>
            {profile.bio || 'Tell people about yourself, your interests, and what you\'re looking for in your professional network.'}
          </Text>
        </View>

        {/* Posts & Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posts & Activity</Text>
            <TouchableOpacity style={styles.createPostButton}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createPostText}>Create Post</Text>
            </TouchableOpacity>
          </View>
          
          {/* Sample Post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} style={styles.postAvatar} />
              <View style={styles.postInfo}>
                <Text style={styles.postAuthor}>{profile.full_name}</Text>
                <Text style={styles.postTime}>2 days ago</Text>
              </View>
              <TouchableOpacity style={styles.postMenu}>
                <MoreHorizontal size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.postContent}>
              Just wrapped up an amazing design sprint! Excited to share what we've been working on. 🚀
            </Text>
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.postAction}>
                <Heart size={16} color="#6B7280" />
                <Text style={styles.postActionText}>12</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postAction}>
                <MessageCircle size={16} color="#6B7280" />
                <Text style={styles.postActionText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postAction}>
                <Share size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowExperienceForm(true)}
            >
              <Plus size={16} color="#6366F1" />
              <Text style={styles.addButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </View>

          {showExperienceForm && (
            <ExperienceForm
              onSuccess={handleExperienceAdded}
              onCancel={handleCancelExperienceForm}
              editingExperience={editingExperience}
            />
          )}

          {loadingExperiences ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading experiences...</Text>
            </View>
          ) : experiences.length > 0 ? (
            experiences.map((experience) => (
              <View key={experience.id} style={styles.experienceItem}>
                <View style={styles.experienceIcon}>
                  <Briefcase size={20} color="#6366F1" />
                </View>
                <View style={styles.experienceContent}>
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceInfo}>
                      <Text style={styles.experienceTitle}>{experience.job_title}</Text>
                      <Text style={styles.experienceCompany}>{experience.company}</Text>
                      <Text style={styles.experienceDuration}>{experience.duration}</Text>
                    </View>
                    <View style={styles.experienceActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditExperience(experience)}
                      >
                        <Edit size={14} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteExperience(experience.id)}
                        disabled={deletingExperienceId === experience.id}
                      >
                        {deletingExperienceId === experience.id ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <Trash2 size={14} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.experienceDescription}>{experience.description}</Text>
                  {experience.tags && experience.tags.length > 0 && (
                    <View style={styles.experienceTags}>
                      {experience.tags.map((tag, index) => (
                        <View key={index} style={styles.experienceTag}>
                          <Text style={styles.experienceTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Briefcase size={32} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No experience added yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your work experience to showcase your professional journey</Text>
            </View>
          )}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowEducationForm(true)}
            >
              <Plus size={16} color="#6366F1" />
              <Text style={styles.addButtonText}>Add Education</Text>
            </TouchableOpacity>
          </View>

          {showEducationForm && (
            <EducationForm
              onSuccess={handleEducationAdded}
              onCancel={() => setShowEducationForm(false)}
            />
          )}

          {loadingEducation ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading education...</Text>
            </View>
          ) : userEducation.length > 0 ? (
            userEducation.map((education) => (
              <View key={education.id} style={styles.educationItem}>
                <View style={styles.educationIcon}>
                  <GraduationCap size={20} color="#8B5CF6" />
                </View>
                <View style={styles.educationContent}>
                  <View style={styles.educationHeader}>
                    <View style={styles.educationInfo}>
                      <Text style={styles.educationDegree}>{education.degree}</Text>
                      <Text style={styles.educationSchool}>{education.school}</Text>
                      <Text style={styles.educationYears}>{education.start_year} - {education.end_year}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEducation(education.id)}
                      disabled={deletingEducationId === education.id}
                    >
                      {deletingEducationId === education.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Trash2 size={14} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <GraduationCap size={32} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No education added yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your educational background to complete your profile</Text>
            </View>
          )}
        </View>

        {/* Skills & Expertise Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={16} color="#6366F1" />
              <Text style={styles.addButtonText}>Add Skill</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.skillsContainer}>
            {(profile.skills || ['UI/UX Design', 'Figma', 'Prototyping', 'User Research']).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity style={styles.removeSkill}>
                  <Text style={styles.removeSkillText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={16} color="#6366F1" />
              <Text style={styles.addButtonText}>Add Project</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.portfolioGrid}>
            <View style={styles.portfolioItem}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.portfolioImage} 
              />
              <View style={styles.portfolioOverlay}>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Eye size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Edit size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Trash2 size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.portfolioTitle}>Design System</Text>
            </View>
            
            <View style={styles.portfolioItem}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.portfolioImage} 
              />
              <View style={styles.portfolioOverlay}>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Eye size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Edit size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.portfolioAction}>
                  <Trash2 size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.portfolioTitle}>Mobile App</Text>
            </View>
            
            <TouchableOpacity style={styles.addPortfolioItem}>
              <Plus size={24} color="#9CA3AF" />
              <Text style={styles.addPortfolioText}>Add Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals & Interests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals & Interests</Text>
            <TouchableOpacity style={styles.editButton}>
              <Edit size={16} color="#6366F1" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.goalsText}>
            {profile.looking_for?.join(', ') || 'Looking for new opportunities, mentorship, and collaboration on innovative projects.'}
          </Text>
          
          <View style={styles.interestsContainer}>
            {(profile.interests || ['Design', 'Technology', 'Startups', 'Innovation']).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

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
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF90',
  },
  collaborationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  collaborationText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 16,
    padding: 20,
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
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF80',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 24,
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
  editButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  aboutText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  createPostText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  postCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
  postAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  postMenu: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
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
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  experienceIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  experienceContent: {
    flex: 1,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  experienceDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  experienceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  experienceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  experienceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  experienceTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  experienceTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  educationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  educationContent: {
    flex: 1,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  educationInfo: {
    flex: 1,
  },
  educationDegree: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  educationSchool: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  educationYears: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  skillText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  removeSkill: {
    width: 16,
    height: 16,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSkillText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  portfolioItem: {
    width: '47%',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  portfolioOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  portfolioAction: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginTop: 8,
  },
  addPortfolioItem: {
    width: '47%',
    height: 120,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPortfolioText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  goalsText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  bottomPadding: {
    height: 100,
  },
});