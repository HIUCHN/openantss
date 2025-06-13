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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

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
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Required field validation
    if (!school.trim()) {
      errors.school = 'School is required';
    }
    if (!degree.trim()) {
      errors.degree = 'Degree is required';
    }
    if (!startYear.trim()) {
      errors.startYear = 'Start year is required';
    }
    if (!endYear.trim()) {
      errors.endYear = 'End year is required';
    }

    // Year validation
    if (startYear.trim() && endYear.trim()) {
      const startYearNum = parseInt(startYear);
      const endYearNum = parseInt(endYear);
      const currentYear = new Date().getFullYear();

      if (isNaN(startYearNum) || isNaN(endYearNum)) {
        if (isNaN(startYearNum)) errors.startYear = 'Please enter a valid year';
        if (isNaN(endYearNum)) errors.endYear = 'Please enter a valid year';
      } else {
        // Start year validation
        if (startYearNum < 1950 || startYearNum > currentYear + 10) {
          errors.startYear = `Year must be between 1950 and ${currentYear + 10}`;
        }
        
        // End year validation
        if (endYearNum < 1950 || endYearNum > currentYear + 10) {
          errors.endYear = `Year must be between 1950 and ${currentYear + 10}`;
        }
        
        // End year must be after start year
        if (endYearNum < startYearNum) {
          errors.endYear = 'End year must be after start year';
        }
        
        // Reasonable duration check (max 15 years)
        if (endYearNum - startYearNum > 15) {
          errors.endYear = 'Education duration seems too long (max 15 years)';
        }
      }
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
      console.log('🎓 Adding new education record...');

      // Create education record
      const newEducation = {
        user_id: user.id,
        school: school.trim(),
        degree: degree.trim(),
        start_year: startYear.trim(),
        end_year: endYear.trim()
      };

      console.log('📝 Education data to insert:', newEducation);

      // Insert the new education record
      const { data, error } = await supabase
        .from('user_education')
        .insert(newEducation)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting education:', error);
        
        // Check for specific constraint violations
        if (error.code === '23505') {
          Alert.alert('Duplicate Entry', 'This education record already exists.');
        } else if (error.code === '23503') {
          Alert.alert('User Error', 'Invalid user. Please sign in again.');
        } else {
          Alert.alert('Database Error', `Failed to add education record: ${error.message}`);
        }
      } else if (data) {
        console.log('✅ Education record added successfully:', data);
        
        // Clear form first
        clearForm();
        
        // Call success callback with the new data
        onSuccess(data);
        
        // Show success message
        Alert.alert('Success!', 'Education record added successfully!');
      } else {
        console.warn('⚠️ No data returned from insert operation');
        Alert.alert('Warning', 'Education record may not have been saved properly.');
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

  const handleYearChange = (value: string, setter: (value: string) => void) => {
    // Only allow numbers and limit to 4 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    setter(numericValue);
    
    // Clear validation errors when user starts typing
    if (validationErrors.startYear || validationErrors.endYear) {
      setValidationErrors(prev => ({
        ...prev,
        startYear: '',
        endYear: ''
      }));
    }
  };

  const getInputStyle = (fieldName: string) => [
    styles.formInput,
    submitting && styles.formInputDisabled,
    validationErrors[fieldName] && styles.formInputError
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>Add Education</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>School or University *</Text>
        <TextInput
          ref={schoolRef}
          style={getInputStyle('school')}
          placeholder="e.g., Harvard University"
          value={school}
          onChangeText={(text) => {
            setSchool(text);
            if (validationErrors.school) {
              setValidationErrors(prev => ({ ...prev, school: '' }));
            }
          }}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => degreeRef.current?.focus()}
          blurOnSubmit={false}
        />
        {validationErrors.school && (
          <Text style={styles.errorText}>{validationErrors.school}</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Degree *</Text>
        <TextInput
          ref={degreeRef}
          style={getInputStyle('degree')}
          placeholder="e.g., Bachelor of Science in Computer Science"
          value={degree}
          onChangeText={(text) => {
            setDegree(text);
            if (validationErrors.degree) {
              setValidationErrors(prev => ({ ...prev, degree: '' }));
            }
          }}
          editable={!submitting}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => startYearRef.current?.focus()}
          blurOnSubmit={false}
        />
        {validationErrors.degree && (
          <Text style={styles.errorText}>{validationErrors.degree}</Text>
        )}
      </View>
      
      <View style={styles.yearRow}>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>Start Year *</Text>
          <TextInput
            ref={startYearRef}
            style={getInputStyle('startYear')}
            placeholder="2020"
            value={startYear}
            onChangeText={(text) => handleYearChange(text, setStartYear)}
            keyboardType="numeric"
            maxLength={4}
            editable={!submitting}
            returnKeyType="next"
            onSubmitEditing={() => endYearRef.current?.focus()}
            blurOnSubmit={false}
          />
          {validationErrors.startYear && (
            <Text style={styles.errorText}>{validationErrors.startYear}</Text>
          )}
        </View>
        <View style={styles.yearGroup}>
          <Text style={styles.formLabel}>End Year *</Text>
          <TextInput
            ref={endYearRef}
            style={getInputStyle('endYear')}
            placeholder="2024"
            value={endYear}
            onChangeText={(text) => handleYearChange(text, setEndYear)}
            keyboardType="numeric"
            maxLength={4}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            blurOnSubmit={true}
          />
          {validationErrors.endYear && (
            <Text style={styles.errorText}>{validationErrors.endYear}</Text>
          )}
        </View>
      </View>
      
      {/* Quick Year Suggestions */}
      <View style={styles.yearSuggestions}>
        <Text style={styles.suggestionsLabel}>Quick suggestions:</Text>
        <View style={styles.suggestionsRow}>
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => {
              setStartYear('2020');
              setEndYear('2024');
            }}
            disabled={submitting}
          >
            <Text style={styles.suggestionText}>2020-2024</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => {
              setStartYear('2018');
              setEndYear('2022');
            }}
            disabled={submitting}
          >
            <Text style={styles.suggestionText}>2018-2022</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => {
              setStartYear('2019');
              setEndYear('2023');
            }}
            disabled={submitting}
          >
            <Text style={styles.suggestionText}>2019-2023</Text>
          </TouchableOpacity>
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
  formInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yearGroup: {
    flex: 1,
  },
  yearSuggestions: {
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