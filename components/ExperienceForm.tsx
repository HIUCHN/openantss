import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/database';

type Experience = Database['public']['Tables']['experiences']['Row'];

interface ExperienceFormProps {
  onSuccess: (experience: Experience) => void;
  onCancel: () => void;
  editingExperience?: Experience | null;
}

export default function ExperienceForm({ onSuccess, onCancel, editingExperience }: ExperienceFormProps) {
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState(editingExperience?.job_title || '');
  const [company, setCompany] = useState(editingExperience?.company || '');
  const [duration, setDuration] = useState(editingExperience?.duration || '');
  const [description, setDescription] = useState(editingExperience?.description || '');
  const [tagsInput, setTagsInput] = useState(editingExperience?.tags?.join(', ') || '');
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Refs for smooth navigation between fields
  const jobTitleRef = useRef<TextInput>(null);
  const companyRef = useRef<TextInput>(null);
  const durationRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const tagsRef = useRef<TextInput>(null);

  // Auto-focus on mount for new entries
  useEffect(() => {
    if (!editingExperience && jobTitleRef.current) {
      setTimeout(() => {
        jobTitleRef.current?.focus();
      }, 100);
    }
  }, [editingExperience]);

  const clearForm = () => {
    setJobTitle('');
    setCompany('');
    setDuration('');
    setDescription('');
    setTagsInput('');
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Required field validation
    if (!jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    if (!company.trim()) {
      errors.company = 'Company name is required';
    }
    if (!duration.trim()) {
      errors.duration = 'Duration is required';
    }
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    // Duration format validation (basic check)
    if (duration.trim() && !duration.match(/\d{4}/)) {
      errors.duration = 'Duration should include years (e.g., "2020 - 2023" or "2020 - Present")';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below and try again');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please sign in again to continue');
      return;
    }

    try {
      setSubmitting(true);
      console.log('💼 Processing experience record...');

      // Parse tags from comma-separated string
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

      const experienceData = {
        user_id: user.id,
        job_title: jobTitle.trim(),
        company: company.trim(),
        duration: duration.trim(),
        description: description.trim(),
        tags: tags.length > 0 ? tags : null
      };

      console.log('📝 Experience data:', experienceData);

      let data, error;

      if (editingExperience) {
        // Update existing experience
        console.log('✏️ Updating experience:', editingExperience.id);
        const result = await supabase
          .from('experiences')
          .update({ ...experienceData, updated_at: new Date().toISOString() })
          .eq('id', editingExperience.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Insert new experience
        console.log('➕ Creating new experience');
        const result = await supabase
          .from('experiences')
          .insert(experienceData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error with experience:', error);
        
        // Handle specific constraint violations
        if (error.code === '23505') {
          Alert.alert('Duplicate Entry', 'This experience record already exists.');
        } else if (error.code === '23503') {
          Alert.alert('User Error', 'Invalid user. Please sign in again.');
        } else {
          Alert.alert('Database Error', `Failed to save experience: ${error.message}`);
        }
      } else if (data) {
        console.log('✅ Experience saved successfully:', data);
        
        // Clear form first
        clearForm();
        
        // Call success callback with the new/updated data
        onSuccess(data);
        
        // Show success message
        Alert.alert(
          'Success!', 
          editingExperience ? 'Experience updated successfully!' : 'Experience added successfully!'
        );
      } else {
        console.warn('⚠️ No data returned from operation');
        Alert.alert('Warning', 'Experience may not have been saved properly.');
      }
    } catch (error) {
      console.error('💥 Unexpected error with experience:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    onCancel();
  };

  const getInputStyle = (fieldName: string) => [
    styles.formInput,
    submitting && styles.formInputDisabled,
    validationErrors[fieldName] && styles.formInputError
  ];

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>
        {editingExperience ? 'Edit Experience' : 'Add Experience'}
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Job Title *</Text>
        <TextInput
          ref={jobTitleRef}
          style={getInputStyle('jobTitle')}
          placeholder="e.g., Senior Product Designer"
          value={jobTitle}
          onChangeText={(text) => {
            setJobTitle(text);
            clearFieldError('jobTitle');
          }}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => companyRef.current?.focus()}
          blurOnSubmit={false}
        />
        {validationErrors.jobTitle && (
          <Text style={styles.errorText}>{validationErrors.jobTitle}</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Company *</Text>
        <TextInput
          ref={companyRef}
          style={getInputStyle('company')}
          placeholder="e.g., Figma"
          value={company}
          onChangeText={(text) => {
            setCompany(text);
            clearFieldError('company');
          }}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => durationRef.current?.focus()}
          blurOnSubmit={false}
        />
        {validationErrors.company && (
          <Text style={styles.errorText}>{validationErrors.company}</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Duration *</Text>
        <TextInput
          ref={durationRef}
          style={getInputStyle('duration')}
          placeholder="e.g., 2020 - Present or 2018 - 2022"
          value={duration}
          onChangeText={(text) => {
            setDuration(text);
            clearFieldError('duration');
          }}
          editable={!submitting}
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => descriptionRef.current?.focus()}
          blurOnSubmit={false}
        />
        {validationErrors.duration && (
          <Text style={styles.errorText}>{validationErrors.duration}</Text>
        )}
      </View>

      {/* Quick Duration Suggestions */}
      <View style={styles.durationSuggestions}>
        <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
        <View style={styles.suggestionsRow}>
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => setDuration('2022 - Present')}
            disabled={submitting}
          >
            <Text style={styles.suggestionText}>2022 - Present</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => setDuration('2020 - 2024')}
            disabled={submitting}
          >
            <Text style={styles.suggestionText}>2020 - 2024</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description *</Text>
        <TextInput
          ref={descriptionRef}
          style={[getInputStyle('description'), styles.textArea]}
          placeholder="Describe your role, responsibilities, and key achievements..."
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            clearFieldError('description');
          }}
          editable={!submitting}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCorrect={true}
          autoCapitalize="sentences"
          returnKeyType="next"
          onSubmitEditing={() => tagsRef.current?.focus()}
          blurOnSubmit={false}
        />
        <Text style={styles.characterCount}>
          {description.length}/500 characters
        </Text>
        {validationErrors.description && (
          <Text style={styles.errorText}>{validationErrors.description}</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Tags (Optional)</Text>
        <TextInput
          ref={tagsRef}
          style={getInputStyle('tags')}
          placeholder="e.g., UX, Design Systems, Leadership (comma separated)"
          value={tagsInput}
          onChangeText={(text) => {
            setTagsInput(text);
            clearFieldError('tags');
          }}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          blurOnSubmit={true}
        />
        <Text style={styles.tagsHint}>
          Separate tags with commas. # will be added automatically.
        </Text>
        {validationErrors.tags && (
          <Text style={styles.errorText}>{validationErrors.tags}</Text>
        )}
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
            <Text style={styles.submitButtonText}>
              {editingExperience ? 'Update Experience' : 'Add Experience'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 500, // Limit height for scrolling
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
  formInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  tagsHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  durationSuggestions: {
    marginBottom: 16,
    paddingTop: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
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
});