import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NameChangeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  currentName: string;
}

export default function NameChangeForm({ onSuccess, onCancel, currentName }: NameChangeFormProps) {
  const { profile } = useAuth();
  const [newName, setNewName] = useState(currentName || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (newName.trim() === currentName) {
      setError('New name is the same as current name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log('🔄 Updating user name from', currentName, 'to', newName.trim());
      
      // Call the RPC function to update name and record history
      const { data, error } = await supabase.rpc('update_user_name', {
        new_full_name: newName.trim(),
        change_reason: reason.trim() || null
      });
      
      if (error) {
        console.error('❌ Error updating name:', error);
        setError(error.message || 'Failed to update name. Please try again.');
        return;
      }
      
      if (data && data.success) {
        console.log('✅ Name updated successfully:', data);
        Alert.alert('Success', 'Your name has been updated successfully!');
        onSuccess();
      } else {
        console.log('⚠️ Name update returned:', data);
        setError(data?.message || 'Failed to update name. Please try again.');
      }
    } catch (error) {
      console.error('❌ Unexpected error updating name:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Your Name</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Current Name</Text>
        <View style={styles.currentNameContainer}>
          <Text style={styles.currentName}>{currentName || 'Not set'}</Text>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>New Name</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Enter your new name"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          editable={!submitting}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Reason (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Why are you changing your name?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!submitting}
        />
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.cancelButton, submitting && styles.disabledButton]} 
          onPress={onCancel}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Update Name</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 6,
  },
  currentNameContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currentName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
    color: '#4B5563',
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
  disabledButton: {
    opacity: 0.6,
  },
});