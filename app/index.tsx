import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OpenAntsLogo from '@/components/OpenAntsLogo';

export default function IndexScreen() {
  const { session, loading, connectionStatus } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session && connectionStatus === 'connected') {
        console.log('✅ User authenticated with active database connection - Redirecting to main app');
        router.replace('/(tabs)');
      } else if (!session) {
        console.log('❌ No session found - Redirecting to login');
        router.replace('/(auth)/login');
      }
      // If session exists but connection is not ready, wait for connection
    }
  }, [session, loading, connectionStatus]);

  const getStatusMessage = () => {
    if (loading) return 'Initializing authentication...';
    
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to database...';
      case 'refreshing':
        return 'Refreshing session...';
      case 'connected':
        return 'Database connected successfully!';
      case 'disconnected':
        return 'Connecting to database...';
      default:
        return 'Initializing...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10B981';
      case 'connecting':
      case 'refreshing':
        return '#F59E0B';
      case 'disconnected':
        return '#EF4444';
      default:
        return 'rgba(255, 255, 255, 0.9)';
    }
  };

  return (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <OpenAntsLogo size={80} color="#FFFFFF" />
          <Text style={styles.appName}>OpenAnts</Text>
          <Text style={styles.subtitle}>Professional Networking</Text>
        </View>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={[styles.loadingText, { color: getStatusColor() }]}>
          {getStatusMessage()}
        </Text>
        
        {/* Connection Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>
            {connectionStatus.toUpperCase()}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
});