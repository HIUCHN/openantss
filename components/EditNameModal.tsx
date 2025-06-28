import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EditNameModalProps {
  visible: boolean;
  onClose: () => void;
  currentName: string | null;
  onNameUpdated: (newName: string) => void;
}

export default function EditNameModal({ visible, onClose, currentName, onNameUpdated }: EditNameModalProps) {
  const [name, setName] = useState(currentName || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Reset form when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setName(currentName || '');
      setReason('');
    }
  }, [visible, currentName]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (name.trim() === currentName) {
      Alert.alert('No Change', 'The name is the same as your current name');
      return;
    }

    try {
      setLoading(true);
      console.log('Updating name from', currentName, 'to', name.trim(), 'with reason:', reason.trim() || 'No reason provided');
      
      // Use the database function to update the name and record history
      const { data, error } = await supabase.rpc('update_user_name', {
        new_full_name: name.trim(),
        change_reason: reason.trim() || null
      });
      
      if (error) {
        console.error('Error updating name:', error);
        Alert.alert('Error', 'Failed to update name. Please try again.');
        return;
      }
      
      console.log('Name update result:', data);
      
      if (data.success) {
        onNameUpdated(name.trim());
        Alert.alert('Success', 'Your name has been updated successfully!');
        onClose();
      } else {
        Alert.alert('Notice', data.message);
      }
    } catch (error) {
      console.error('Unexpected error updating name:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Your Name</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              editable={!loading}
              autoFocus
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reason for Change (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why are you changing your name?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              editable={!loading}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#6366F1',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});