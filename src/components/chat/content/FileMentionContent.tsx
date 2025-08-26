import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { detectFileMentions } from '../../../utils/fileMentions';

interface FileMentionContentProps {
  content: string;
  onFileMentionPress?: (filePath: string) => void;
  selectable?: boolean;
  disableFileMentionPress?: boolean;
}

export function FileMentionContent({ content, onFileMentionPress, selectable = false, disableFileMentionPress = false }: FileMentionContentProps) {
  const mentions = detectFileMentions(content);
  
  if (mentions.length === 0) {
    return (
      <Text style={styles.content} selectable={selectable}>
        {content}
      </Text>
    );
  }

  // Split content into parts and render mentions specially
  const renderContentWithMentions = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.start > lastIndex) {
        parts.push(
          <Text key={`text-${index}`} style={styles.content} selectable={selectable}>
            {content.slice(lastIndex, mention.start)}
          </Text>
        );
      }

      // Add mention as styled component
      const filePath = mention.path;
      const fileName = filePath.split('/').pop() || filePath;

      const mentionElement = (
        <View key={`mention-${index}`} style={styles.mentionContainer}>
          <Ionicons
            name="document-text"
            size={14}
            color="#3b82f6"
            style={styles.mentionIcon}
          />
          <Text style={styles.mentionText}>
            {fileName}
          </Text>
        </View>
      );

      if (disableFileMentionPress) {
        parts.push(mentionElement);
      } else {
        parts.push(
          <TouchableOpacity
            key={`mention-${index}`}
            style={styles.mentionContainer}
            onPress={() => onFileMentionPress?.(filePath)}
            activeOpacity={0.7}
          >
            {mentionElement}
          </TouchableOpacity>
        );
      }

      lastIndex = mention.end;
    });

    // Add remaining text after last mention
    if (lastIndex < content.length) {
      parts.push(
        <Text key="text-end" style={styles.content} selectable={selectable}>
          {content.slice(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  return (
    <View style={styles.container}>
      {renderContentWithMentions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    color: '#ffffff',
  },
  mentionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  mentionIcon: {
    marginRight: 4,
  },
  mentionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
});