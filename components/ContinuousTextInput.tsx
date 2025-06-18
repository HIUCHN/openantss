import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CreditCard as Edit3, Save, X } from 'lucide-react-native';

interface ContinuousTextInputProps {
  placeholder?: string;
  initialValue?: string;
  onSave?: (text: string) => void;
  onCancel?: () => void;
  multiline?: boolean;
  maxLength?: number;
  style?: any;
  editable?: boolean;
  showWordCount?: boolean;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export default function ContinuousTextInput({
  placeholder = "Start typing...",
  initialValue = "",
  onSave,
  onCancel,
  multiline = true,
  maxLength = 1000,
  style,
  editable = true,
  showWordCount = true,
  autoFocus = false,
  minHeight = 120,
  maxHeight = 300,
}: ContinuousTextInputProps) {
  const [text, setText] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [inputHeight, setInputHeight] = useState(minHeight);
  const textInputRef = useRef<TextInput>(null);

  // Auto focus when editing starts
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      // Small delay to ensure the component is ready
      const timer = setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    if (!editable) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onSave?.(text);
    textInputRef.current?.blur();
  };

  const handleCancel = () => {
    setText(initialValue);
    setIsEditing(false);
    onCancel?.();
    textInputRef.current?.blur();
  };

  const handleContentSizeChange = (event: any) => {
    if (multiline) {
      const { height } = event.nativeEvent.contentSize;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, height + 20));
      setInputHeight(newHeight);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = text.length;

  // Empty state - show when not editing and no text
  if (!isEditing && !text.trim()) {
    return (
      <TouchableOpacity 
        style={[styles.emptyContainer, style]} 
        onPress={handleStartEditing}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <View style={styles.emptyContent}>
          <Edit3 size={20} color="#9CA3AF" />
          <Text style={styles.emptyText}>{placeholder}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Display state - show when not editing but has text
  if (!isEditing) {
    return (
      <TouchableOpacity 
        style={[styles.displayContainer, style]} 
        onPress={handleStartEditing}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <Text style={styles.displayText}>{text}</Text>
        {editable && (
          <View style={styles.editIcon}>
            <Edit3 size={16} color="#6B7280" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Editing state - the critical part
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, { minHeight: inputHeight }]}>
        <TextInput
          ref={textInputRef}
          style={[
            styles.textInput,
            multiline && { 
              height: Math.max(inputHeight, minHeight),
              textAlignVertical: 'top' 
            }
          ]}
          value={text}
          onChangeText={setText} // Direct assignment - no wrapper function
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          maxLength={maxLength}
          autoCorrect={true}
          autoCapitalize="sentences"
          keyboardType="default"
          returnKeyType={multiline ? "default" : "done"}
          blurOnSubmit={false} // Critical: prevents losing focus
          scrollEnabled={multiline}
          editable={true} // Always true when in editing mode
          selectTextOnFocus={false}
          autoFocus={false} // We handle focus manually
          // Remove any event handlers that might interfere
          onFocus={() => {}} // Empty function to prevent interference
          onBlur={() => {}} // Empty function to prevent interference
          onSubmitEditing={() => {}} // Empty function to prevent interference
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <X size={16} color="#6B7280" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Word/Character Count */}
      {showWordCount && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {wordCount} words • {characterCount}/{maxLength} characters
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  displayContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    minHeight: 80,
  },
  displayText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    paddingRight: 30,
  },
  editIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    lineHeight: 20,
    padding: 0,
    margin: 0,
    minHeight: 80,
    borderWidth: 0,
    // Web-specific styles to remove default browser styling
    ...(typeof window !== 'undefined' && {
      outlineStyle: 'none',
      outlineWidth: 0,
      resize: 'none',
    }),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  cancelButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  countContainer: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});