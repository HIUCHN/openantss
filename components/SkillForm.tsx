import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SkillFormProps {
  onSuccess: (newSkill: any) => void;
  onCancel: () => void;
  existingSkills?: string[]; // To prevent duplicates
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const YEARS_OPTIONS = [
  { value: null, label: 'Not specified' },
  { value: 1, label: '< 1 year' },
  { value: 2, label: '1-2 years' },
  { value: 5, label: '3-5 years' },
  { value: 10, label: '5-10 years' },
  { value: 15, label: '10+ years' },
];

export default function SkillForm({ onSuccess, onCancel, existingSkills = [] }: SkillFormProps) {
  const { user } = useAuth();
  const [skillName, setSkillName] = useState('');
  const [level, setLevel] = useState<string | null>(null);
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const skillNameRef = useRef<TextInput>(null);

  const clearForm = () => {
    setSkillName('');
    setLevel(null);
    setYearsExperience(null);
    setIsFeatured(false);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!skillName.trim()) {
      errors.skillName = 'Skill name is required';
    } else if (skillName.trim().length < 2) {
      errors.skillName = 'Skill name must be at least 2 characters';
    } else if (skillName.trim().length > 50) {
      errors.skillName = 'Skill name must be less than 50 characters';
    } else if (existingSkills.some(skill => skill.toLowerCase() === skillName.trim().toLowerCase())) {
      errors.skillName = 'You already have this skill added';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
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
      console.log('🎯 Adding new skill...');

      const skillData = {
        user_id: user.id,
        name: skillName.trim(),
        level: level || null,
        years_experience: yearsExperience || null,
        is_featured: isFeatured,
      };

      console.log('📝 Skill data to insert:', skillData);

      const { data, error } = await supabase
        .from('skills')
        .insert(skillData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting skill:', error);
        
        if (error.code === '23505') {
          Alert.alert('Duplicate Skill', 'You already have this skill added.');
        } else {
          Alert.alert('Database Error', `Failed to add skill: ${error.message}`);
        }
      } else if (data) {
        console.log('✅ Skill added successfully:', data);
        
        clearForm();
        onSuccess(data);
        Alert.alert('Success!', 'Skill added successfully!');
      } else {
        console.warn('⚠️ No data returned from insert operation');
        Alert.alert('Warning', 'Skill may not have been saved properly.');
      }
    } catch (error) {
      console.error('💥 Unexpected error adding skill:', error);
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
    styles.input,
    submitting && styles.inputDisabled,
    validationErrors[fieldName] && styles.inputError
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Skill</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCancel}
          disabled={submitting}
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Skill Name *</Text>
          <TextInput
            ref={skillNameRef}
            style={getInputStyle('skillName')}
            placeholder="e.g., React, Python, UI/UX Design"
            value={skillName}
            onChangeText={(text) => {
              setSkillName(text);
              if (validationErrors.skillName) {
                setValidationErrors(prev => ({ ...prev, skillName: '' }));
              }
            }}
            editable={!submitting}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            maxLength={50}
          />
          {validationErrors.skillName && (
            <Text style={styles.errorText}>{validationErrors.skillName}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Proficiency Level (Optional)</Text>
          <View style={styles.levelContainer}>
            {SKILL_LEVELS.map((levelOption) => (
              <TouchableOpacity
                key={levelOption.value}
                style={[
                  styles.levelButton,
                  level === levelOption.value && styles.levelButtonSelected,
                  submitting && styles.levelButtonDisabled
                ]}
                onPress={() => setLevel(level === levelOption.value ? null : levelOption.value)}
                disabled={submitting}
              >
                <Text style={[
                  styles.levelButtonText,
                  level === levelOption.value && styles.levelButtonTextSelected
                ]}>
                  {levelOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Years of Experience (Optional)</Text>
          <View style={styles.yearsContainer}>
            {YEARS_OPTIONS.map((yearOption) => (
              <TouchableOpacity
                key={yearOption.value || 'none'}
                style={[
                  styles.yearButton,
                  yearsExperience === yearOption.value && styles.yearButtonSelected,
                  submitting && styles.yearButtonDisabled
                ]}
                onPress={() => setYearsExperience(yearsExperience === yearOption.value ? null : yearOption.value)}
                disabled={submitting}
              >
                <Text style={[
                  styles.yearButtonText,
                  yearsExperience === yearOption.value && styles.yearButtonTextSelected
                ]}>
                  {yearOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <TouchableOpacity
            style={[styles.featuredToggle, submitting && styles.featuredToggleDisabled]}
            onPress={() => setIsFeatured(!isFeatured)}
            disabled={submitting}
          >
            <View style={[styles.checkbox, isFeatured && styles.checkboxSelected]}>
              {isFeatured && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.featuredLabel}>Feature this skill (highlight as top skill)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
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
            <>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Skill</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  levelButtonDisabled: {
    opacity: 0.6,
  },
  levelButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  levelButtonTextSelected: {
    color: '#FFFFFF',
  },
  yearsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  yearButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  yearButtonDisabled: {
    opacity: 0.6,
  },
  yearButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  yearButtonTextSelected: {
    color: '#FFFFFF',
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredToggleDisabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  featuredLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
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
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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