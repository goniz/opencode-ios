import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { detectFileMentions } from '../../../utils/fileMentions';

interface FileMentionContentProps {
  content: string;
  onFileMentionPress?: (filePath: string) => void;
  selectable?: boolean;
  disableFileMentionPress?: boolean;
}

// Regular expression to match URLs
const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

export function FileMentionContent({ content, onFileMentionPress, selectable = false, disableFileMentionPress = false }: FileMentionContentProps) {
  const mentions = detectFileMentions(content);
  
  // Handle link press
  const handleLinkPress = (url: string) => {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    WebBrowser.openBrowserAsync(fullUrl).catch(error => {
      console.error('Error opening link:', error);
    });
  };

  // Render text with both file mentions and URLs
  const renderContentWithMentionsAndUrls = () => {
    // First, handle file mentions
    if (mentions.length === 0) {
      // No file mentions, just handle URLs in the entire content
      return renderTextWithUrls(content, 0);
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    mentions.forEach((mention, index) => {
      // Add text before mention (this might contain URLs)
      if (mention.start > lastIndex) {
        const textBefore = content.slice(lastIndex, mention.start);
        parts.push(...renderTextWithUrls(textBefore, lastIndex));
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

    // Add remaining text after last mention (this might contain URLs)
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      parts.push(...renderTextWithUrls(textAfter, lastIndex));
    }

    return parts;
  };

  // Helper function to render text with clickable URLs
  const renderTextWithUrls = (text: string, startIndex: number) => {
    const urlMatches = Array.from(text.matchAll(URL_REGEX));
    
    if (urlMatches.length === 0) {
      // No URLs found, render as plain text
      return [
        <Text key={`plain-${startIndex}`} style={styles.content} selectable={selectable}>
          {text}
        </Text>
      ];
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    urlMatches.forEach((match, index) => {
      const url = match[0];
      const urlStart = match.index!;
      
      // Add text before URL
      if (urlStart > lastIndex) {
        parts.push(
          <Text key={`text-${startIndex}-${index}`} style={styles.content} selectable={selectable}>
            {text.slice(lastIndex, urlStart)}
          </Text>
        );
      }
      
      // Add URL as clickable text
      parts.push(
        <Text 
          key={`url-${startIndex}-${index}`} 
          style={[styles.content, styles.link]} 
          onPress={() => handleLinkPress(url)}
        >
          {url}
        </Text>
      );
      
      lastIndex = urlStart + url.length;
    });
    
    // Add remaining text after last URL
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-end-${startIndex}`} style={styles.content} selectable={selectable}>
          {text.slice(lastIndex)}
        </Text>
      );
    }
    
    return parts;
  };

  return (
    <View style={styles.container}>
      {renderContentWithMentionsAndUrls()}
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
  link: {
    color: '#60a5fa',
    textDecorationLine: 'underline',
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