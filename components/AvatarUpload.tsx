import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { Camera, Upload, User, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  size?: number;
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  onAvatarUpdate, 
  size = 80 
}: AvatarUploadProps) {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload your avatar!'
        );
        return false;
      }
    }
    return true;
  };

  const uploadImage = async (uri: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload an avatar');
      return;
    }

    try {
      setUploading(true);
      console.log('🖼️ Starting avatar upload process...');

      // Create a unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('📁 File path:', filePath);

      let uploadData;

      if (Platform.OS === 'web') {
        // Web implementation - convert to blob
        console.log('🌐 Web platform detected, converting to blob...');
        const response = await fetch(uri);
        const blob = await response.blob();
        uploadData = blob;
      } else {
        // Mobile implementation - use FormData
        console.log('📱 Mobile platform detected, using FormData...');
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: `image/${fileExt}`,
          name: fileName,
        } as any);
        uploadData = formData;
      }

      // Upload to Supabase Storage
      console.log('☁️ Uploading to Supabase storage...');
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);

      // Update the user's profile with the new avatar URL
      console.log('👤 Updating profile with new avatar URL...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        throw updateError;
      }

      console.log('✅ Profile updated successfully');

      // Call the callback to update the UI
      onAvatarUpdate(publicUrl);
      setShowOptions(false);
      
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      Alert.alert('Error', `Failed to upload avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      console.log('📷 Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('📷 Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ Image selected:', result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web. Please use "Choose from Library" instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take a photo!'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);

              // Update the profile to remove avatar URL
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  avatar_url: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (error) throw error;

              onAvatarUpdate('');
              Alert.alert('Success', 'Avatar removed successfully!');
            } catch (error) {
              console.error('❌ Error removing avatar:', error);
              Alert.alert('Error', 'Failed to remove avatar. Please try again.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const OptionsModal = () => {
    if (!showOptions) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.optionsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Avatar</Text>
            <TouchableOpacity 
              onPress={() => setShowOptions(false)}
              style={styles.closeButton}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={pickImageFromLibrary}
              disabled={uploading}
            >
              <Upload size={20} color="#6366F1" />
              <Text style={styles.optionText}>Choose from Library</Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={takePhoto}
                disabled={uploading}
              >
                <Camera size={20} color="#6366F1" />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
            )}

            {currentAvatarUrl && (
              <TouchableOpacity 
                style={[styles.optionButton, styles.removeButton]}
                onPress={removeAvatar}
                disabled={uploading}
              >
                <X size={20} color="#EF4444" />
                <Text style={[styles.optionText, styles.removeText]}>Remove Avatar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={() => setShowOptions(true)}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {currentAvatarUrl ? (
          <Image 
            source={{ uri: currentAvatarUrl }} 
            style={[styles.avatar, { width: size, height: size }]} 
          />
        ) : (
          <View style={[styles.placeholderAvatar, { width: size, height: size }]}>
            <User size={size * 0.4} color="#9CA3AF" />
          </View>
        )}
        
        {uploading ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.editOverlay}>
            <Camera size={size * 0.15} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <OptionsModal />
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 1000,
  },
  placeholderAvatar: {
    backgroundColor: '#F3F4F6',
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    borderRadius: 1000,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 280,
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
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  removeButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  removeText: {
    color: '#EF4444',
  },
});