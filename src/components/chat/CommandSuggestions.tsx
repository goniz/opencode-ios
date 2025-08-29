import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { semanticColors } from '../../styles/colors';
import type { CommandSuggestion } from '../../utils/commandMentions';

interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[];
  visible: boolean;
  onSelectCommand: (commandName: string) => void;
  onClose: () => void;
}

export function CommandSuggestions({ 
  suggestions, 
  visible, 
  onSelectCommand, 
  onClose 
}: CommandSuggestionsProps) {
  console.log('CommandSuggestions render:', { visible, suggestionsCount: suggestions.length });
  
  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: CommandSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelectCommand(item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
         <Ionicons
           name="terminal-outline"
           size={16}
           color={semanticColors.textMuted}
           style={styles.commandIcon}
         />
        <View style={styles.commandInfo}>
          <Text style={styles.commandName} numberOfLines={1}>
            /{item.name}
          </Text>
          {item.description && (
            <Text style={styles.commandDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {(item.agent || item.model) && (
            <View style={styles.commandMeta}>
              {item.agent && (
                <Text style={styles.metaText}>
                  Agent: {item.agent}
                </Text>
              )}
              {item.model && (
                <Text style={styles.metaText}>
                  Model: {item.model}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select a command</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          testID="command-suggestions-close-button"
        >
           <Ionicons name="close" size={16} color={semanticColors.textMuted} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.suggestionsList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={false}
      >
        {suggestions.map((item, index) => (
          <View key={`${item.name}-${index}`}>
            {renderSuggestion({ item })}
          </View>
        ))}
      </ScrollView>
      
      {suggestions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="terminal-outline" size={24} color="#6b7280" />
          <Text style={styles.emptyText}>No commands found</Text>
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
     backgroundColor: semanticColors.background,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: semanticColors.border,
     maxHeight: 300,
     marginBottom: 8,
     elevation: 10, // Higher elevation to ensure it's above other elements
     zIndex: 1000, // Add explicit z-index
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
     borderBottomColor: semanticColors.border,
   },
   headerText: {
     fontSize: 12,
     fontWeight: '600',
     color: semanticColors.textMuted,
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
     paddingVertical: 12,
     borderBottomWidth: 1,
     borderBottomColor: semanticColors.border,
   },
   suggestionContent: {
     flexDirection: 'row',
     alignItems: 'flex-start',
   },
   commandIcon: {
     marginRight: 8,
     marginTop: 2,
   },
   commandInfo: {
     flex: 1,
   },
   commandName: {
     fontSize: 14,
     fontWeight: '600',
     color: semanticColors.textPrimary,
     marginBottom: 4,
   },
   commandDescription: {
     fontSize: 12,
     color: semanticColors.textMuted,
     lineHeight: 16,
     marginBottom: 6,
   },
   commandMeta: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
   },
   metaText: {
     fontSize: 10,
     color: semanticColors.icon,
     backgroundColor: semanticColors.cardBackground,
     paddingHorizontal: 6,
     paddingVertical: 2,
     borderRadius: 4,
     overflow: 'hidden',
   },
   emptyState: {
     padding: 24,
     alignItems: 'center',
     justifyContent: 'center',
   },
   emptyText: {
     fontSize: 14,
     color: semanticColors.icon,
     marginTop: 8,
   },
});