import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EducationFormProps {
  onSuccess: (newEducation: any) => void;
  onCancel: () => void;
}

export default function EducationForm({ onSuccess, onCancel }: EducationFormProps) {
  const { user } = useAuth();
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Refs for smooth navigation between fields
  const schoolRef = useRef<TextInput>(null);
  const degreeRef = useRef<TextInput>(null);
  const startYearRef = useRef<TextInput>(null);
  const endYearRef = useRef<TextInput>(null);

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
      console.log('🎓 Adding new education record...');

      const newEducation = {
        user_id: user.id,
        school: school.trim(),
        degree: degree.trim(),
        start_year: startYear.trim(),
        end_year: endYear.trim()
      };

      console.log('📝 Education data to insert:', newEducation);

      const { data, error } = await supabase
        .from('user_education')
        .insert(newEducation)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting education:', error);
        Alert.alert('Error', 'Failed to add education record. Please try again.');
      } else if (data) {
        console.log('✅ Education record added successfully:', data);
        clearForm();
        onSuccess(data);
        Alert.alert('Success!', 'Education record added successfully!');
      }
    } catch (error) {
      console.error('💥 Unexpected error with education:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearForm();
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>Add Education</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>School or University *</Text>
        <TextInput
          ref={schoolRef}
          style={[styles.formInput, submitting && styles.formInputDisabled]}
          placeholder="e.g., Harvard University"
          value={school}
          onChangeText={setSchool}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => degreeRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Degree *</Text>
        <TextInput
          ref={degreeRef}
          style={[styles.formInput, submitting && styles.formInputDisabled]}
          placeholder="e.g., Bachelor of Science in Computer Science"
          value={degree}
          onChangeText={setDegree}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => startYearRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>
      
      <View style={styles.yearRow}>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>Start Year *</Text>
          <TextInput
            ref={startYearRef}
            style={[styles.formInput, submitting && styles.formInputDisabled]}
            placeholder="2018"
            value={startYear}
            onChangeText={setStartYear}
            keyboardType="numeric"
            maxLength={4}
            editable={!submitting}
            returnKeyType="next"
            onSubmitEditing={() => endYearRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>End Year *</Text>
          <TextInput
            ref={endYearRef}
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
}

const styles = StyleSheet.create({
  container: {
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
});