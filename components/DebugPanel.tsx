import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface DebugPanelProps {
  isVisible: boolean;
}

export default function DebugPanel({ isVisible }: DebugPanelProps) {
  const { session, user, profile, loading } = useAuth();

  if (!isVisible) return null;

  const getConnectionStatus = () => {
    if (loading) return { status: 'CONNECTING', color: '#F59E0B', text: 'Đang kết nối...' };
    if (session && user) return { status: 'CONNECTED', color: '#10B981', text: 'Đã kết nối' };
    return { status: 'DISCONNECTED', color: '#EF4444', text: 'Chưa kết nối' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <View style={styles.debugContainer}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>🔍 DEBUG MODE</Text>
        <View style={[styles.statusIndicator, { backgroundColor: connectionStatus.color }]}>
          <Text style={styles.statusText}>{connectionStatus.text}</Text>
        </View>
      </View>

      <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
        {/* Database Connection Status */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>🔗 Trạng thái kết nối Database</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: connectionStatus.color }]}>
              {connectionStatus.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Loading:</Text>
            <Text style={styles.value}>{loading ? 'true' : 'false'}</Text>
          </View>
        </View>

        {/* Session Information */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>🔐 Thông tin Session</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Session exists:</Text>
            <Text style={[styles.value, { color: session ? '#10B981' : '#EF4444' }]}>
              {session ? 'true' : 'false'}
            </Text>
          </View>
          {session && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Access Token:</Text>
                <Text style={styles.valueSmall}>
                  {session.access_token ? `${session.access_token.substring(0, 20)}...` : 'null'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Expires At:</Text>
                <Text style={styles.valueSmall}>
                  {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString('vi-VN') : 'null'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* User Information */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>👤 Thông tin User</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User exists:</Text>
            <Text style={[styles.value, { color: user ? '#10B981' : '#EF4444' }]}>
              {user ? 'true' : 'false'}
            </Text>
          </View>
          {user && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>ID:</Text>
                <Text style={styles.valueSmall}>{user.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email Verified:</Text>
                <Text style={[styles.value, { color: user.email_confirmed_at ? '#10B981' : '#F59E0B' }]}>
                  {user.email_confirmed_at ? 'true' : 'false'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Created At:</Text>
                <Text style={styles.valueSmall}>
                  {new Date(user.created_at).toLocaleString('vi-VN')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Profile Information */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>📋 Thông tin Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Profile exists:</Text>
            <Text style={[styles.value, { color: profile ? '#10B981' : '#EF4444' }]}>
              {profile ? 'true' : 'false'}
            </Text>
          </View>
          {profile && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Username:</Text>
                <Text style={styles.value}>{profile.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{profile.full_name || 'null'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role:</Text>
                <Text style={styles.value}>{profile.role || 'null'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{profile.company || 'null'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Public Mode:</Text>
                <Text style={[styles.value, { color: profile.is_public ? '#10B981' : '#EF4444' }]}>
                  {profile.is_public ? 'true' : 'false'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Proximity Alerts:</Text>
                <Text style={[styles.value, { color: profile.proximity_alerts ? '#10B981' : '#EF4444' }]}>
                  {profile.proximity_alerts ? 'true' : 'false'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Direct Messages:</Text>
                <Text style={[styles.value, { color: profile.direct_messages ? '#10B981' : '#EF4444' }]}>
                  {profile.direct_messages ? 'true' : 'false'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Storage Information */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>💾 Thông tin Storage</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>
              {typeof window !== 'undefined' ? 'Web (localStorage)' : 'Mobile (SecureStore)'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Session Stored:</Text>
            <Text style={[styles.value, { color: session ? '#10B981' : '#EF4444' }]}>
              {session ? 'true' : 'false'}
            </Text>
          </View>
        </View>

        {/* Environment Information */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>⚙️ Thông tin Environment</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Supabase URL:</Text>
            <Text style={styles.valueSmall}>
              {process.env.EXPO_PUBLIC_SUPABASE_URL ? 
                `${process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 
                'Not configured'
              }
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Anon Key:</Text>
            <Text style={styles.valueSmall}>
              {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 
                `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
                'Not configured'
              }
            </Text>
          </View>
        </View>

        {/* Real-time Status */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>⏱️ Real-time Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Time:</Text>
            <Text style={styles.valueSmall}>
              {new Date().toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>App State:</Text>
            <Text style={styles.value}>Active</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 9999,
    paddingTop: 50,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  debugContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  debugSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    flex: 1,
    minWidth: 100,
  },
  value: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  valueSmall: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
});