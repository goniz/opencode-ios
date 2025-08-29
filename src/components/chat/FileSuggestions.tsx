import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FileSuggestion } from '../../utils/fileMentions';

interface FileSuggestionsProps {
  suggestions: FileSuggestion[];
  visible: boolean;
  onSelectFile: (filePath: string) => void;
  onClose: () => void;
}

export function FileSuggestions({ 
  suggestions, 
  visible, 
  onSelectFile, 
  onClose 
}: FileSuggestionsProps) {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: FileSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelectFile(item.path)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <Ionicons 
          name="document-text-outline" 
          size={16} 
          color="#9ca3af" 
          style={styles.fileIcon}
        />
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.fileName}
          </Text>
          <Text style={styles.filePath} numberOfLines={1}>
            {item.directory}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select a file</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.suggestionsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={false}
      >
        {suggestions.map((item, index) => (
          <View key={`${item.path}-${index}`}>
            {renderSuggestion({ item })}
          </View>
        ))}
      </ScrollView>
      
      {suggestions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={24} color="#6b7280" />
          <Text style={styles.emptyText}>No files found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 200,
    marginBottom: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  filePath: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});