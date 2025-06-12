import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Shield, CircleHelp as HelpCircle, LogOut, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountSettingsModal({ visible, onClose }: AccountSettingsModalProps) {
  const { profile, signOut, updateProfile } = useAuth();
  const [privacy, setPrivacy] = useState({
    publicMode: profile?.is_public ?? true,
    proximityAlerts: profile?.proximity_alerts ?? true,
    directMessages: profile?.direct_messages ?? false
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePrivacyToggle = async (key: string, value: boolean) => {
    const updates = { [key]: value };
    const { error } = await updateProfile(updates);
    
    if (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } else {
      setPrivacy(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowLogoutModal(false);
      onClose();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const PrivacyToggle = ({ title, description, value, onToggle }) => (
    <View style={styles.privacyToggle}>
      <View style={styles.privacyInfo}>
        <Text style={styles.privacyTitle}>{title}</Text>
        <Text style={styles.privacyDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const LogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.logoutModalContent}>
          <View style={styles.logoutModalHeader}>
            <View style={styles.logoutIconContainer}>
              <LogOut size={24} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Sign Out</Text>
            <Text style={styles.logoutModalSubtitle}>
              Are you sure you want to sign out of your account?
            </Text>
          </View>
          
          <View style={styles.logoutModalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            <View style={styles.settingsModalHeader}>
              <Text style={styles.settingsModalTitle}>Account Settings</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.settingsContent}>
              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Privacy & Visibility</Text>
                
                <PrivacyToggle
                  title="Public Mode"
                  description="Show your profile to nearby professionals"
                  value={privacy.publicMode}
                  onToggle={(value) => handlePrivacyToggle('is_public', value)}
                />
                <PrivacyToggle
                  title="Proximity Alerts"
                  description="Get notified about relevant connections nearby"
                  value={privacy.proximityAlerts}
                  onToggle={(value) => handlePrivacyToggle('proximity_alerts', value)}
                />
                <PrivacyToggle
                  title="Direct Messages"
                  description="Allow others to message you directly"
                  value={privacy.directMessages}
                  onToggle={(value) => handlePrivacyToggle('direct_messages', value)}
                />
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.settingsSectionTitle}>Account Actions</Text>
                
                <TouchableOpacity style={styles.settingsItem}>
                  <Shield size={20} color="#6366F1" />
                  <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Privacy Policy</Text>
                    <Text style={styles.settingsItemDescription}>Review our privacy policy</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingsItem}>
                  <HelpCircle size={20} color="#6366F1" />
                  <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemTitle}>Help & Support</Text>
                    <Text style={styles.settingsItemDescription}>Get help or contact support</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.settingsItem, styles.dangerItem]}
                  onPress={() => {
                    onClose();
                    setShowLogoutModal(true);
                  }}
                >
                  <LogOut size={20} color="#EF4444" />
                  <View style={styles.settingsItemContent}>
                    <Text style={[styles.settingsItemTitle, styles.dangerText]}>Sign Out</Text>
                    <Text style={styles.settingsItemDescription}>Sign out of your account</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LogoutModal />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flex: 1,
    marginTop: 100,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  settingsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  settingsSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  privacyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyInfo: {
    flex: 1,
    marginRight: 16,
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  settingsItemDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  dangerItem: {
    marginTop: 8,
  },
  dangerText: {
    color: '#EF4444',
  },
  logoutModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    maxWidth: 320,
    width: '100%',
  },
  logoutModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF2F2',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  logoutModalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutModalActions: {
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
  signOutButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});