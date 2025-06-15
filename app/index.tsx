import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OpenAntsLogo from '@/components/OpenAntsLogo';

export default function IndexScreen() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        console.log('✅ User authenticated - Redirecting to main app with database access');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No session found - Redirecting to login');
        router.replace('/(auth)/login');
      }
    }
  }, [session, loading]);

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
        <Text style={styles.loadingText}>
          {loading ? 'Connecting to database...' : 'Initializing...'}
        </Text>
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
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 16,
  },
});