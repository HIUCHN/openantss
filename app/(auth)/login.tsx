import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DebugPanel from '@/components/DebugPanel';
import { IS_DEBUG } from '@/constants';
import { Image } from 'react-native';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(params.email as string || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn } = useAuth();

  // Clear error message when user starts typing
  useEffect(() => {
    if (errorMessage && (email || password)) {
      setErrorMessage(null);
    }
  }, [email, password, errorMessage]);

  const handleBoltLogoPress = () => {
    Linking.openURL('https://bolt.new/');
  };

  const handleLogin = async () => {
    // Clear any previous error messages
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting to sign in with:', email.trim());
      
      const { error } = await signIn(email.trim().toLowerCase(), password);
      
      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases with more helpful messages
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
          setErrorMessage('The email or password you entered is incorrect. Please check your credentials and try again.');
        } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          setErrorMessage('Please check your email and click the verification link before signing in.');
        } else if (error.message?.includes('Too many requests') || error.message?.includes('rate_limit')) {
          setErrorMessage('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (error.message?.includes('User not found') || error.message?.includes('user_not_found')) {
          setErrorMessage('No account found with this email address. Please check your email or sign up for a new account.');
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setErrorMessage('Network error. Please check your internet connection and try again.');
        } else {
          setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
        }
      } else {
        console.log('Login successful');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setErrorMessage('An unexpected error occurred. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Image 
                  source={{ uri: 'https://stackblitz.com/storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBCSWVlUndFPSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--8a643fb02132fc31a3e1f6434e8fc82713fd5924//OpenAnts logo copy copy.png' }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>OpenAnts</Text>
              <Text style={styles.tagline}>Know People Before You Meet Them</Text>
            </View>

            {/* Bolt Logo */}
            <TouchableOpacity 
              style={styles.boltLogoContainer}
              onPress={handleBoltLogoPress}
            >
              <Image 
                source={require('@/assets/images/white_circle_360x360 copy.png')}
                style={styles.boltLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to continue networking</Text>
            </View>

            {/* Error Message Display */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#EF4444" style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, errorMessage && (errorMessage.includes('email') || errorMessage.includes('Email')) && styles.inputWrapperError]}>
                  <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => setEmail(text.toLowerCase().trim())}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errorMessage && errorMessage.includes('password') && styles.inputWrapperError]}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#6366F1', '#8B5CF6']}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                  {!loading && <ArrowRight size={20} color="#FFFFFF" />}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupSection}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Debug Panel - Only show when IS_DEBUG is true */}
      <DebugPanel isVisible={IS_DEBUG && showDebugPanel} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 200,
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  boltLogoContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  boltLogo: {
    width: 40,
    height: 40,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: 500,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    lineHeight: 20,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 24,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    marginTop: 12,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    minHeight: 56,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6366F1',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
});