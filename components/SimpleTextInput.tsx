import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SimpleTextInputProps {
  placeholder?: string;
  initialValue?: string;
  onSave?: (text: string) => void;
  multiline?: boolean;
  autoFocus?: boolean;
}

export default function SimpleTextInput({
  placeholder = "Start typing...",
  initialValue = "",
  onSave,
  multiline = true,
  autoFocus = false,
}: SimpleTextInputProps) {
  const [text, setText] = useState(initialValue);
  const [isActive, setIsActive] = useState(autoFocus);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleActivate = () => {
    setIsActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSave = () => {
    onSave?.(text);
    setIsActive(false);
    inputRef.current?.blur();
  };

  if (!isActive) {
    return (
      <TouchableOpacity style={styles.inactiveContainer} onPress={handleActivate}>
        <Text style={styles.inactiveText}>
          {text || placeholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.activeContainer}>
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        blurOnSubmit={false}
        autoCorrect={true}
        autoCapitalize="sentences"
        selectTextOnFocus={false}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inactiveContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
  },
  inactiveText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 8,
    padding: 16,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    ...(typeof window !== 'undefined' && {
      outlineStyle: 'none',
      outlineWidth: 0,
      resize: 'none',
    }),
  },
  saveButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});