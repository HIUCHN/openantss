import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DebugPanel from '@/components/DebugPanel';
import { IS_DEBUG } from '@/constants';
// Debug mode toggle - set to true to show debug information

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleSignup = async () => {
    // Comprehensive validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }

    if (!validateUsername(username.trim())) {
      Alert.alert('Validation Error', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    if (fullName.trim().length < 2) {
      Alert.alert('Validation Error', 'Full name must be at least 2 characters long');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting to create account for:', email.trim());
      
      const { error } = await signUp(
        email.trim().toLowerCase(), 
        password, 
        username.trim().toLowerCase(), 
        fullName.trim()
      );
      
      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('already registered')) {
          Alert.alert('Account Exists', 'An account with this email already exists. Please try signing in instead.');
        } else if (error.message?.includes('invalid email')) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
        } else if (error.message?.includes('weak password')) {
          Alert.alert('Weak Password', 'Please choose a stronger password with at least 6 characters.');
        } else if (error.message?.includes('username')) {
          Alert.alert('Username Error', 'This username is already taken. Please choose a different one.');
        } else {
          Alert.alert('Signup Failed', error.message || 'An unexpected error occurred. Please try again.');
        }
      } else {
        console.log('Account created successfully');
        setUserEmail(email.trim().toLowerCase());
        setSignupSuccess(true);
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    router.replace({
      pathname: '/(auth)/login',
      params: { email: userEmail }
    });
  };

  // Success state - show after successful signup
  if (signupSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.successHeader}
        >
          <View style={styles.successLogoContainer}>
            <View style={styles.successCheckmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Account Created!</Text>
            <Text style={styles.successSubtitle}>Welcome to OpenAnts</Text>
          </View>
        </LinearGradient>

        <View style={styles.successFormContainer}>
          <View style={styles.successContent}>
            <Text style={styles.successMessage}>
              Your account has been created successfully!
            </Text>
            
            <View style={styles.emailVerificationCard}>
              <View style={styles.emailIcon}>
                <Text style={styles.emailIconText}>📧</Text>
              </View>
              <Text style={styles.verificationTitle}>Check Your Email</Text>
              <Text style={styles.verificationText}>
                We've sent a verification link to:
              </Text>
              <Text style={styles.userEmailText}>{userEmail}</Text>
              <Text style={styles.verificationInstructions}>
                Click the link in your email to activate your account, then return here to sign in.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleGoToSignIn}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.signInButtonGradient}
              >
                <Text style={styles.signInButtonText}>Continue to Sign In</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToSignupButton}
              onPress={() => setSignupSuccess(false)}
            >
              <Text style={styles.backToSignupText}>← Back to Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>OA</Text>
              </View>
              <Text style={styles.appName}>Join OpenAnts</Text>
              <Text style={styles.tagline}>Start building your professional network</Text>
            </View>

            {/* Debug Toggle Button - Only show when IS_DEBUG is true */}
            {IS_DEBUG && (
              <TouchableOpacity 
                style={styles.debugToggle}
                onPress={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Text style={styles.debugToggleText}>
                  {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a unique username"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                <Text style={styles.inputHint}>3-20 characters, letters, numbers, and underscores only</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
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
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a secure password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    blurOnSubmit={false}
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
                <Text style={styles.inputHint}>At least 6 characters</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#6366F1', '#8B5CF6']}
                  style={styles.signupButtonGradient}
                >
                  <Text style={styles.signupButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                  {!loading && <ArrowRight size={20} color="#FFFFFF" />}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.termsSection}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </View>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Sign in</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    position: 'relative',
    minHeight: 180,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  debugToggle: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  debugToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 600,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
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
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  eyeButton: {
    padding: 4,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    minHeight: 56,
  },
  signupButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  termsSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#6366F1',
    fontFamily: 'Inter-Medium',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
  successHeader: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 200,
  },
  successLogoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successCheckmark: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmarkText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  successFormContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  emailVerificationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#EEF2FF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emailIconText: {
    fontSize: 24,
  },
  verificationTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  userEmailText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
    marginBottom: 16,
  },
  verificationInstructions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    width: '100%',
    marginBottom: 20,
  },
  signInButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    minHeight: 56,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  backToSignupButton: {
    paddingVertical: 12,
  },
  backToSignupText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});