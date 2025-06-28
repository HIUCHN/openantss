import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react-native';

interface NameChange {
  id: string;
  previous_name: string;
  new_name: string;
  changed_at: string;
  reason: string | null;
}

export default function NameChangeHistory() {
  const { user } = useAuth();
  const [nameChanges, setNameChanges] = useState<NameChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNameChangeHistory();
    }
  }, [user]);

  const fetchNameChangeHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('name_change_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('changed_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching name change history:', error);
        setError('Failed to load name change history');
      } else {
        setNameChanges(data || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching name change history:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNameChangeHistory}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (nameChanges.length === 0) {
    return null; // Don't show anything if there's no history
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Clock size={16} color="#6366F1" />
          <Text style={styles.headerTitle}>Name Change History</Text>
        </View>
        {expanded ? (
          <ChevronUp size={16} color="#6B7280" />
        ) : (
          <ChevronDown size={16} color="#6B7280" />
        )}
      </TouchableOpacity>
      
      {expanded && (
        <FlatList
          data={nameChanges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.changeInfo}>
                <Text style={styles.changeDate}>{formatDate(item.changed_at)}</Text>
                <View style={styles.nameChange}>
                  <Text style={styles.previousName}>{item.previous_name || 'Not set'}</Text>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.newName}>{item.new_name}</Text>
                </View>
                {item.reason && (
                  <Text style={styles.reason}>Reason: {item.reason}</Text>
                )}
              </View>
            </View>
          )}
          style={styles.historyList}
          contentContainerStyle={styles.historyContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 16,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  historyList: {
    maxHeight: 300,
  },
  historyContent: {
    padding: 16,
  },
  historyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  changeInfo: {
    gap: 4,
  },
  changeDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  nameChange: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  previousName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  newName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  reason: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
});