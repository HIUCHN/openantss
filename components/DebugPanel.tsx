import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface DebugPanelProps {
  isVisible: boolean;
}

export default function DebugPanel({ isVisible }: DebugPanelProps) {
  const { session, user, profile, loading, connectionStatus } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { status: 'ĐANG KẾT NỐI', color: '#F59E0B', text: 'Đang kết nối database...' };
      case 'connected':
        return { status: 'ĐÃ KẾT NỐI', color: '#10B981', text: 'Database đã kết nối' };
      case 'refreshing':
        return { status: 'ĐANG LÀM MỚI', color: '#3B82F6', text: 'Đang làm mới session...' };
      case 'disconnected':
      default:
        return { status: 'CHƯA KẾT NỐI', color: '#EF4444', text: 'Database chưa kết nối' };
    }
  };

  const connectionInfo = getConnectionStatusInfo();

  const getSessionExpirationInfo = () => {
    if (!session?.expires_at) return null;
    
    const expirationTime = session.expires_at * 1000;
    const currentTime = Date.now();
    const timeLeft = expirationTime - currentTime;
    
    if (timeLeft <= 0) {
      return { text: 'ĐÃ HẾT HẠN', color: '#EF4444' };
    }
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return { text: `${days} ngày ${hours % 24} giờ`, color: '#10B981' };
    } else if (hours > 0) {
      return { text: `${hours} giờ ${minutes % 60} phút`, color: hours > 1 ? '#10B981' : '#F59E0B' };
    } else {
      return { text: `${minutes} phút`, color: minutes > 5 ? '#F59E0B' : '#EF4444' };
    }
  };

  const sessionExpiration = getSessionExpirationInfo();

  return (
    <View style={styles.debugContainer}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>🔍 DEBUG MODE - SESSION MANAGEMENT</Text>
        <View style={[styles.statusIndicator, { backgroundColor: connectionInfo.color }]}>
          <Text style={styles.statusText}>{connectionInfo.status}</Text>
        </View>
      </View>

      <ScrollView style={styles.debugContent} showsVerticalScrollIndicator={false}>
        {/* Database Connection Status */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>🔗 Trạng thái kết nối Database</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: connectionInfo.color }]}>
              {connectionInfo.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Description:</Text>
            <Text style={[styles.valueSmall, { color: connectionInfo.color }]}>
              {connectionInfo.text}
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
                <Text style={styles.label}>Refresh Token:</Text>
                <Text style={styles.valueSmall}>
                  {session.refresh_token ? `${session.refresh_token.substring(0, 20)}...` : 'null'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Expires At:</Text>
                <Text style={styles.valueSmall}>
                  {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString('vi-VN') : 'null'}
                </Text>
              </View>
              {sessionExpiration && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Time Left:</Text>
                  <Text style={[styles.value, { color: sessionExpiration.color }]}>
                    {sessionExpiration.text}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Token Type:</Text>
                <Text style={styles.value}>{session.token_type || 'bearer'}</Text>
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
              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Sign In:</Text>
                <Text style={styles.valueSmall}>
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('vi-VN') : 'null'}
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
              <View style={styles.infoRow}>
                <Text style={styles.label}>Created At:</Text>
                <Text style={styles.valueSmall}>
                  {new Date(profile.created_at).toLocaleString('vi-VN')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Updated At:</Text>
                <Text style={styles.valueSmall}>
                  {new Date(profile.updated_at).toLocaleString('vi-VN')}
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
          <View style={styles.infoRow}>
            <Text style={styles.label}>Auto Refresh:</Text>
            <Text style={[styles.value, { color: '#10B981' }]}>Enabled</Text>
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
              {currentTime.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>App State:</Text>
            <Text style={styles.value}>Active</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Session Check:</Text>
            <Text style={styles.value}>Every 60s</Text>
          </View>
        </View>

        {/* API Call Status */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>🌐 API Call Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ready for API calls:</Text>
            <Text style={[styles.value, { color: (session && connectionStatus === 'connected') ? '#10B981' : '#EF4444' }]}>
              {(session && connectionStatus === 'connected') ? 'true' : 'false'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Auth Header:</Text>
            <Text style={styles.valueSmall}>
              {session ? `Bearer ${session.access_token.substring(0, 15)}...` : 'Not available'}
            </Text>
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
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    flex: 1,
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