import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  showFilter?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function SearchBar({ 
  placeholder = "Search...", 
  onSearch, 
  onFilter, 
  showFilter = false,
  value,
  onChangeText 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(value || '');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onChangeText?.(text);
    onSearch?.(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onChangeText?.('');
    onSearch?.('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          onSubmitEditing={() => onSearch?.(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      {showFilter && (
        <TouchableOpacity onPress={onFilter} style={styles.filterButton}>
          <Filter size={20} color="#6366F1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
});