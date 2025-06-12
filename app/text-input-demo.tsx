import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import ContinuousTextInput from '@/components/ContinuousTextInput';
import SimpleTextInput from '@/components/SimpleTextInput';

export default function TextInputDemoScreen() {
  const [savedTexts, setSavedTexts] = useState<string[]>([]);

  const handleSaveText = (text: string) => {
    if (text.trim()) {
      setSavedTexts(prev => [...prev, text]);
      Alert.alert('Success', 'Text saved successfully!');
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancelled', 'Changes discarded');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text Input Testing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Simple Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Ultra Simple Test</Text>
          <Text style={styles.sectionDescription}>
            This is the most basic implementation possible. Click and type continuously.
          </Text>
          <SimpleTextInput
            placeholder="Click here and type away..."
            onSave={handleSaveText}
            autoFocus={false}
          />
        </View>

        {/* Auto-focused Simple Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Auto-focused Simple Test</Text>
          <Text style={styles.sectionDescription}>
            This one automatically focuses when loaded. Should allow continuous typing immediately.
          </Text>
          <SimpleTextInput
            placeholder="Should be focused and ready to type..."
            onSave={handleSaveText}
            autoFocus={true}
          />
        </View>

        {/* Original Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Enhanced Text Editor</Text>
          <Text style={styles.sectionDescription}>
            The full-featured version with all the bells and whistles.
          </Text>
          <ContinuousTextInput
            placeholder="Click here for the enhanced experience..."
            onSave={handleSaveText}
            onCancel={handleCancel}
            maxLength={500}
            showWordCount={true}
          />
        </View>

        {/* Debugging Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Debugging Tips</Text>
          <View style={styles.debugList}>
            <Text style={styles.debugItem}>• Try the "Ultra Simple Test" first</Text>
            <Text style={styles.debugItem}>• If that works, the issue is in the enhanced version</Text>
            <Text style={styles.debugItem}>• If it doesn't work, it's a platform-specific issue</Text>
            <Text style={styles.debugItem}>• Check browser console for any errors</Text>
            <Text style={styles.debugItem}>• Try on different browsers/devices</Text>
          </View>
        </View>

        {/* Saved Texts Display */}
        {savedTexts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 Saved Texts</Text>
            {savedTexts.map((text, index) => (
              <View key={index} style={styles.savedTextItem}>
                <Text style={styles.savedTextIndex}>#{index + 1}</Text>
                <Text style={styles.savedTextContent}>{text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  debugList: {
    gap: 8,
  },
  debugItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  savedTextItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  savedTextIndex: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
    marginBottom: 4,
  },
  savedTextContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 32,
  },
});