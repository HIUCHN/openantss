import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Switch, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MoveVertical as MoreVertical, CircleCheck as CheckCircle, Users, Heart, Eye, TrendingUp, MapPin, Calendar, Building, GraduationCap, Plus, CreditCard as Edit3, Trash2, RefreshCw, Briefcase, Award, Target, Clock, Share, MessageCircle, UserPlus, Settings, Camera, X, Save, Bold, Italic, Link, MoreHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import EducationForm from '@/components/EducationForm';
import ExperienceForm from '@/components/ExperienceForm';
import ContinuousTextInput from '@/components/ContinuousTextInput';
import { useFocusEffect } from '@react-navigation/native';

type UserEducation = Database['public']['Tables']['user_education']['Row'];
type Experience = Database['public']['Tables']['experiences']['Row'];

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
  },
  skills: [
    { id: 1, name: 'UI/UX Design', color: '#3B82F6', level: 95 },
    { id: 2, name: 'Product Strategy', color: '#8B5CF6', level: 88 },
    { id: 3, name: 'User Research', color: '#10B981', level: 92 },
    { id: 4, name: 'Prototyping', color: '#F59E0B', level: 85 },
    { id: 5, name: 'Design Systems', color: '#EF4444', level: 90 },
    { id: 6, name: 'Mentoring', color: '#6366F1', level: 87 }
  ],
  goals: [
    { id: 1, text: 'Collaboration Partners', icon: UserPlus, color: '#6366F1' },
    { id: 2, text: 'Mentorship Opportunities', icon: Award, color: '#10B981' },
    { id: 3, text: 'Speaking Engagements', icon: MessageCircle, color: '#F59E0B' }
  ],
  interests: [
    { id: 1, name: '#FinTech' },
    { id: 2, name: '#HealthTech' },
    { id: 3, name: '#EdTech' },
    { id: 4, name: '#AI/ML' }
  ],
  portfolio: [
    {
      id: 1,
      title: 'Design System 2.0',
      description: 'Component library redesign',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#3B82F6', '#8B5CF6']
    },
    {
      id: 2,
      title: 'Mobile App Redesign',
      description: 'E-commerce platform',
      image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#10B981', '#3B82F6']
    },
    {
      id: 3,
      title: 'Dashboard Analytics',
      description: 'B2B SaaS product',
      image: 'https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=400',
      gradient: ['#F59E0B', '#EF4444']
    }
  ],
  posts: [
    {
      id: 1,
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
  const [userData, setUserData] = useState(getUserData());
  
  // Education state
  const [educationList, setEducationList] = useState<UserEducation[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [showEducationForm, setShowEducationForm] = useState(false);
  
  // Experience state
  const [experienceList, setExperienceList] = useState<Experience[]>([]);
  const [experienceLoading, setExperienceLoading] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  
  // Modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  
  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{[key: string]: string}>({});
  
  // Post creation state
  const [newPostContent, setNewPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  
  // Skill management state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('85');
  
  // Use refs to prevent unnecessary re-fetching
  const isFetchingEducationRef = useRef(false);
  const isFetchingExperienceRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Education fetch function
  const fetchEducationData = useCallback(async (userId: string, forceRefresh = false) => {
    if (isFetchingEducationRef.current) {
      console.log('🚫 Education fetch already in progress, skipping...');
      return;
    }

    isFetchingEducationRef.current = true;
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
        setEducationList([]);
      } else {
        console.log('✅ Education data fetched successfully:', data?.length || 0, 'records');
        setEducationList(data || []);
        setEducationError(null);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error fetching education:', error);
      if (mountedRef.current) {
        setEducationError(`Unexpected error: ${error.message}`);
        setEducationList([]);
      }
    } finally {
      if (mountedRef.current) {
        setEducationLoading(false);
      }
      isFetchingEducationRef.current = false;
    }
  }, []);

  // Experience fetch function
  const fetchExperienceData = useCallback(async (userId: string, forceRefresh = false) => {
    if (isFetchingExperienceRef.current) {
      console.log('🚫 Experience fetch already in progress, skipping...');
      return;
    }

    isFetchingExperienceRef.current = true;
    setExperienceLoading(true);
    setExperienceError(null);

    try {
      console.log('🔄 Fetching experience data for user:', userId, forceRefresh ? '(FORCED REFRESH)' : '(NORMAL FETCH)');
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (error) {
        console.error('❌ Error fetching experience:', error);
        setExperienceError(`Failed to load experience data: ${error.message}`);
        setExperienceList([]);
      } else {
        console.log('✅ Experience data fetched successfully:', data?.length || 0, 'records');
        setExperienceList(data || []);
        setExperienceError(null);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error fetching experience:', error);
      if (mountedRef.current) {
        setExperienceError(`Unexpected error: ${error.message}`);
        setExperienceList([]);
      }
    } finally {
      if (mountedRef.current) {
        setExperienceLoading(false);
      }
      isFetchingExperienceRef.current = false;
    }
  }, []);

  // Use useFocusEffect instead of useEffect or AppState for optimized data fetching
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('🔁 Screen focused — fetching data...');
        fetchEducationData(user.id, true);
        fetchExperienceData(user.id, true);
      }
    }, [user, fetchEducationData, fetchExperienceData])
  );

  // Education handlers
  const handleEducationSuccess = (newEducation: UserEducation) => {
    console.log('✅ New education added:', newEducation);
    setEducationList(prev => {
      const updated = [newEducation, ...prev];
      return updated.sort((a, b) => parseInt(b.start_year) - parseInt(a.start_year));
    });
    setShowEducationForm(false);
    if (user) {
      setTimeout(() => {
        fetchEducationData(user.id, true);
      }, 300);
    }
  };

  const handleEducationCancel = () => {
    setShowEducationForm(false);
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
                setEducationList(prev => prev.filter(edu => edu.id !== educationId));
                Alert.alert('Success', 'Education record deleted successfully');
                
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

  // Experience handlers
  const handleExperienceSuccess = (experience: Experience) => {
    console.log('✅ Experience saved:', experience);
    
    if (editingExperience) {
      // Update existing experience in list
      setExperienceList(prev => 
        prev.map(exp => exp.id === experience.id ? experience : exp)
      );
      setEditingExperience(null);
    } else {
      // Add new experience to list
      setExperienceList(prev => [experience, ...prev]);
    }
    
    setShowExperienceForm(false);
    
    if (user) {
      setTimeout(() => {
        fetchExperienceData(user.id, true);
      }, 300);
    }
  };

  const handleExperienceCancel = () => {
    setShowExperienceForm(false);
    setEditingExperience(null);
  };

  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setShowExperienceForm(true);
  };

  const handleDeleteExperience = async (experienceId: string) => {
    Alert.alert(
      'Delete Experience',
      'Are you sure you want to delete this experience record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting experience record:', experienceId);
              
              const { error } = await supabase
                .from('experiences')
                .delete()
                .eq('id', experienceId);

              if (error) {
                console.error('❌ Error deleting experience:', error);
                Alert.alert('Error', 'Failed to delete experience record');
              } else {
                console.log('✅ Experience record deleted successfully');
                setExperienceList(prev => prev.filter(exp => exp.id !== experienceId));
                Alert.alert('Success', 'Experience record deleted successfully');
                
                if (user) {
                  setTimeout(() => {
                    fetchExperienceData(user.id, true);
                  }, 300);
                }
              }
            } catch (error) {
              console.error('💥 Unexpected error deleting experience:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  // Delete handlers for other sections
  const handleDeleteSkill = (skillId: number) => {
    Alert.alert(
      'Remove Skill',
      'Are you sure you want to remove this skill?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setUserData(prev => ({
              ...prev,
              skills: prev.skills.filter(skill => skill.id !== skillId)
            }));
          }
        }
      ]
    );
  };

  const handleDeleteGoal = (goalId: number) => {
    Alert.alert(
      'Remove Goal',
      'Are you sure you want to remove this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setUserData(prev => ({
              ...prev,
              goals: prev.goals.filter(goal => goal.id !== goalId)
            }));
          }
        }
      ]
    );
  };

  const handleDeleteInterest = (interestId: number) => {
    Alert.alert(
      'Remove Interest',
      'Are you sure you want to remove this interest?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setUserData(prev => ({
              ...prev,
              interests: prev.interests.filter(interest => interest.id !== interestId)
            }));
          }
        }
      ]
    );
  };

  const handleDeletePortfolioItem = (portfolioId: number) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this portfolio project?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setUserData(prev => ({
              ...prev,
              portfolio: prev.portfolio.filter(item => item.id !== portfolioId)
            }));
          }
        }
      ]
    );
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setUserData(prev => ({
              ...prev,
              posts: prev.posts.filter(post => post.id !== postId)
            }));
          }
        }
      ]
    );
  };

  // Add handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      Alert.alert('Error', 'Please enter a skill name');
      return;
    }

    const newSkill = {
      id: Date.now(),
      name: newSkillName.trim(),
      color: '#6366F1',
      level: parseInt(newSkillLevel)
    };

    setUserData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));

    setNewSkillName('');
    setNewSkillLevel('85');
    setShowSkillModal(false);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please write something for your post');
      return;
    }

    const tags = postTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    const newPost = {
      id: Date.now(),
      content: newPostContent.trim(),
      timestamp: 'now',
      likes: 0,
      comments: 0,
      tags: tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`)
    };

    setUserData(prev => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));

    setNewPostContent('');
    setPostTags('');
    setShowCreatePostModal(false);
    Alert.alert('Success', 'Post created successfully!');
  };

  const handleManualRefresh = async () => {
    if (!user) return;
    
    console.log('🔄 Manual refresh triggered');
    await Promise.all([
      fetchEducationData(user.id, true),
      fetchExperienceData(user.id, true)
    ]);
  };

  const handleBack = () => {
    router.back();
  };

  // Editing functions
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditingValues({ [field]: currentValue });
  };

  const saveEdit = (field: string) => {
    const newValue = editingValues[field];
    if (newValue !== undefined) {
      setUserData(prev => ({
        ...prev,
        [field]: newValue
      }));
    }
    setEditingField(null);
    setEditingValues({});
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValues({});
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

  const SkillBar = ({ skill, onDelete }) => (
    <View style={styles.skillContainer}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillName}>{skill.name}</Text>
        <View style={styles.skillActions}>
          <Text style={styles.skillPercentage}>{skill.level}%</Text>
          <TouchableOpacity 
            style={styles.deleteSkillButton}
            onPress={() => onDelete(skill.id)}
          >
            <X size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
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

  const PortfolioCard = ({ project, onDelete }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <TouchableOpacity 
        style={styles.portfolioCard}
        onPress={() => setShowActions(!showActions)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={project.gradient}
          style={styles.portfolioGradient}
        >
          <View style={styles.portfolioOverlay} />
        </LinearGradient>
        
        {showActions && (
          <View style={styles.portfolioActions}>
            <TouchableOpacity 
              style={styles.portfolioActionButton}
              onPress={() => onDelete(project.id)}
            >
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.portfolioActionButton}>
              <Edit3 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.portfolioContent}>
          <Text style={styles.portfolioTitle}>{project.title}</Text>
          <Text style={styles.portfolioDescription}>{project.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ExperienceCard = ({ experience }) => (
    <View style={styles.experienceCard}>
      <View style={styles.experienceHeader}>
        <View style={styles.experienceLogo}>
          <Briefcase size={20} color="#FFFFFF" />
        </View>
        <View style={styles.experienceInfo}>
          <Text style={styles.experienceTitle}>{experience.job_title}</Text>
          <Text style={styles.experienceCompany}>{experience.company} • {experience.duration}</Text>
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
        <View style={styles.experienceActions}>
          <TouchableOpacity 
            style={styles.editExperienceButton}
            onPress={() => handleEditExperience(experience)}
          >
            <Edit3 size={16} color="#6366F1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteExperience(experience.id)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Photo Upload Modal
  const PhotoUploadModal = () => (
    <Modal
      visible={showPhotoModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPhotoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.photoModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
            <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.photoOptions}>
            <TouchableOpacity style={styles.photoOption}>
              <Camera size={24} color="#6366F1" />
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoOption}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={{ width: 24, height: 24, borderRadius: 4 }}
              />
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Create Post Modal
  const CreatePostModal = () => (
    <Modal
      visible={showCreatePostModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreatePostModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createPostModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={() => setShowCreatePostModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.postEditor}>
            <TextInput
              style={styles.postTextInput}
              placeholder="What's on your mind?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <View style={styles.postToolbar}>
              <TouchableOpacity style={styles.toolbarButton}>
                <Bold size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <Italic size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton}>
                <Link size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.tagsInput}
              placeholder="Tags (comma separated)"
              value={postTags}
              onChangeText={setPostTags}
            />
            
            <Text style={styles.characterCount}>
              {newPostContent.length}/500 characters
            </Text>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreatePostModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.publishButtonText}>Publish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Add Skill Modal
  const AddSkillModal = () => (
    <Modal
      visible={showSkillModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSkillModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.skillModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Skill</Text>
            <TouchableOpacity onPress={() => setShowSkillModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.skillForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Skill Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., React Native"
                value={newSkillName}
                onChangeText={setNewSkillName}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Proficiency Level (%)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="85"
                value={newSkillLevel}
                onChangeText={setNewSkillLevel}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowSkillModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddSkill}
            >
              <Text style={styles.addButtonText}>Add Skill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setShowPhotoModal(true)}
            >
              <Image source={{ uri: userData.image }} style={styles.avatar} />
              <View style={styles.cameraOverlay}>
                <Camera size={16} color="#FFFFFF" />
              </View>
              <View style={styles.verifiedBadge}>
                <CheckCircle size={12} color="#FFFFFF" fill="#10B981" />
              </View>
            </TouchableOpacity>
            
            {/* Editable Name */}
            {editingField === 'name' ? (
              <View style={styles.editingContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingValues.name}
                  onChangeText={(text) => setEditingValues(prev => ({ ...prev, name: text }))}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => saveEdit('name')} style={styles.saveButton}>
                    <Save size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit} style={styles.cancelEditButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.editableField}
                onPress={() => startEditing('name', userData.name)}
              >
                <Text style={styles.userName}>{userData.name}</Text>
                <Edit3 size={14} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>
            )}
            
            {/* Editable Role */}
            {editingField === 'role' ? (
              <View style={styles.editingContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingValues.role}
                  onChangeText={(text) => setEditingValues(prev => ({ ...prev, role: text }))}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => saveEdit('role')} style={styles.saveButton}>
                    <Save size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit} style={styles.cancelEditButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.editableField}
                onPress={() => startEditing('role', `${userData.role} at ${userData.company}`)}
              >
                <Text style={styles.userRole}>{userData.role} at {userData.company}</Text>
                <Edit3 size={12} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
            
            {/* Editable Status */}
            {editingField === 'status' ? (
              <View style={styles.editingContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingValues.status}
                  onChangeText={(text) => setEditingValues(prev => ({ ...prev, status: text }))}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => saveEdit('status')} style={styles.saveButton}>
                    <Save size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit} style={styles.cancelEditButton}>
                    <X size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.editableField, styles.statusContainer]}
                onPress={() => startEditing('status', userData.status)}
              >
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{userData.status}</Text>
                <Edit3 size={12} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Metrics Grid - Updated to 4 metrics only */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <MetricCard icon={Users} value={userData.metrics.connections} label="Connections" color="#6366F1" />
            <MetricCard icon={Heart} value={userData.metrics.followers} label="Followers" color="#EF4444" />
            <MetricCard icon={Eye} value={userData.metrics.views} label="Views" color="#3B82F6" />
            <MetricCard icon={TrendingUp} value={userData.metrics.liveMatches} label="Live Matches" color="#10B981" />
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <ContinuousTextInput
            placeholder="Tell us about yourself..."
            initialValue={userData.bio}
            onSave={(text) => setUserData(prev => ({ ...prev, bio: text }))}
            maxLength={500}
            showWordCount={true}
          />
        </View>

        {/* Posts & Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Posts & Activity</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => setShowCreatePostModal(true)}
            >
              <Text style={styles.createPostText}>Create Post</Text>
            </TouchableOpacity>
          </View>
          
          {userData.posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: userData.image }} style={styles.postAvatar} />
                <View style={styles.postInfo}>
                  <View style={styles.postNameRow}>
                    <Text style={styles.postName}>{userData.name}</Text>
                    <Text style={styles.postTimestamp}>{post.timestamp}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.postMenuButton}>
                  <MoreHorizontal size={16} color="#6B7280" />
                </TouchableOpacity>
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
                <TouchableOpacity 
                  style={styles.deletePostButton}
                  onPress={() => handleDeletePost(post.id)}
                >
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.experienceActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleManualRefresh}
                disabled={experienceLoading}
              >
                <RefreshCw size={16} color="#6366F1" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setEditingExperience(null);
                  setShowExperienceForm(!showExperienceForm);
                }}
              >
                <Plus size={16} color="#6366F1" />
                <Text style={styles.editButtonText}>
                  {showExperienceForm ? 'Cancel' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Add/Edit Experience Form */}
          {showExperienceForm && (
            <ExperienceForm
              onSuccess={handleExperienceSuccess}
              onCancel={handleExperienceCancel}
              editingExperience={editingExperience}
            />
          )}
          
          {/* Error State */}
          {experienceError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {experienceError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleManualRefresh}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Loading State */}
          {experienceLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading experience data...</Text>
            </View>
          )}

          {/* Experience List */}
          {!experienceError && !experienceLoading && (
            <>
              {experienceList.length > 0 ? (
                experienceList.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Briefcase size={32} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No experience added yet</Text>
                  <Text style={styles.emptySubtext}>Tap "Add" to add your first work experience</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.educationActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setShowEducationForm(!showEducationForm)}
              >
                <Plus size={16} color="#6366F1" />
                <Text style={styles.editButtonText}>
                  {showEducationForm ? 'Cancel' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Add Education Form */}
          {showEducationForm && (
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
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowSkillModal(true)}
            >
              <Plus size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Add Skill</Text>
            </TouchableOpacity>
          </View>
          
          {userData.skills.map((skill) => (
            <SkillBar key={skill.id} skill={skill} onDelete={handleDeleteSkill} />
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
              <Plus size={16} color="#6366F1" />
              <Text style={styles.editButtonText}>Add Project</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.portfolioGrid}>
            {userData.portfolio.map((project) => (
              <PortfolioCard 
                key={project.id} 
                project={project} 
                onDelete={handleDeletePortfolioItem}
              />
            ))}
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
                {userData.goals.map((goal) => {
                  const IconComponent = goal.icon;
                  return (
                    <View key={goal.id} style={[styles.goalTag, { backgroundColor: `${goal.color}20` }]}>
                      <IconComponent size={14} color={goal.color} />
                      <Text style={[styles.goalTagText, { color: goal.color }]}>{goal.text}</Text>
                      <TouchableOpacity 
                        style={styles.removeTagButton}
                        onPress={() => handleDeleteGoal(goal.id)}
                      >
                        <X size={12} color={goal.color} />
                      </TouchableOpacity>
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
                {userData.interests.map((interest) => (
                  <View key={interest.id} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest.name}</Text>
                    <TouchableOpacity 
                      style={styles.removeTagButton}
                      onPress={() => handleDeleteInterest(interest.id)}
                    >
                      <X size={12} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modals */}
      <PhotoUploadModal />
      <CreatePostModal />
      <AddSkillModal />
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
  cameraOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    minWidth: 200,
  },
  editActions: {
    flexDirection: 'row',
    gap: 4,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    padding: 8,
  },
  cancelEditButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 8,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
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
  experienceActions: {
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
  postMenuButton: {
    padding: 4,
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
    alignItems: 'center',
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
  deletePostButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  experienceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  experienceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  experienceLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#6366F1',
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
    marginBottom: 8,
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
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  experienceTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#1D4ED8',
  },
  experienceActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  editExperienceButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
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
  skillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  deleteSkillButton: {
    padding: 2,
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
  portfolioActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  portfolioActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 6,
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
  removeTagButton: {
    marginLeft: 4,
    padding: 2,
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestTagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    width: '80%',
    maxWidth: 400,
  },
  createPostModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  skillModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  photoOptions: {
    gap: 16,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  photoOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  postEditor: {
    marginBottom: 24,
  },
  postTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 12,
  },
  postToolbar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  toolbarButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  tagsInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
  },
  skillForm: {
    marginBottom: 24,
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
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  publishButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
  },
});