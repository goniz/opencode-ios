import React from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import SyntaxHighlighter from 'react-native-code-highlighter';
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import * as WebBrowser from 'expo-web-browser';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';
import { FileMentionContent } from './FileMentionContent';

// Create a custom markdownit instance with linkify enabled
const markdownItInstance = MarkdownIt({linkify: true, typographer: true});

export interface TextContentProps {
  content: string;
  isMarkdown?: boolean;
  isLast?: boolean;
  variant?: 'default' | 'user' | 'assistant';
  messageId?: string;
  partIndex?: number;
}

export const TextContent: React.FC<TextContentProps> = ({
  content,
  isMarkdown = false,
  isLast = false,
  variant = 'default',
  messageId = '',
  partIndex = 0,
}) => {
  // Ensure content is always a string to prevent undefined errors
  const safeContent = content ?? '';
  // Use expandable hook for content management
  // For user messages, disable auto-expansion to prevent huge bubbles
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: safeContent,
    maxLines: variant === 'user' ? 10 : 3,
    autoExpand: variant === 'user' ? false : isLast,
    contentType: 'text',
  });

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'user':
        return {
          color: '#ffffff',
        };
      case 'assistant':
        return {
          color: '#e5e7eb',
        };
      default:
        return {
          color: '#e5e7eb',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Markdown styles
  const markdownStyles = {
    body: {
      ...variantStyles,
    },
    paragraph: {
      marginVertical: 4,
    },
    text: {
      ...variantStyles,
    },
    heading1: {
      ...variantStyles,
      fontSize: 24,
      fontWeight: '600' as '600',
      marginVertical: 12,
    },
    heading2: {
      ...variantStyles,
      fontSize: 20,
      fontWeight: '600' as '600',
      marginVertical: 10,
    },
    heading3: {
      ...variantStyles,
      fontSize: 18,
      fontWeight: '600' as '600',
      marginVertical: 8,
    },
    link: {
      color: '#60a5fa',
      textDecorationLine: 'underline' as 'underline',
    },
    list_item: {
      marginVertical: 2,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    code_inline: {
      ...variantStyles,
      backgroundColor: '#374151',
      padding: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: '#1f2937',
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
      fontFamily: 'monospace',
    },
    fence: {
      backgroundColor: '#1f2937',
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
      fontFamily: 'monospace',
    },
    blockquote: {
      ...variantStyles,
      backgroundColor: '#374151',
      borderLeftColor: '#4b5563',
      borderLeftWidth: 4,
      padding: 8,
      marginVertical: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: '#4b5563',
      borderRadius: 4,
      marginVertical: 8,
    },
    th: {
      ...variantStyles,
      backgroundColor: '#374151',
      padding: 8,
      fontWeight: '600' as '600',
    },
    td: {
      ...variantStyles,
      padding: 8,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: '#4b5563',
    },
    s: {
      ...variantStyles,
      textDecorationLine: 'line-through' as 'line-through',
    },
    strong: {
      ...variantStyles,
      fontWeight: '600' as '600',
    },
    em: {
      ...variantStyles,
      fontStyle: 'italic' as 'italic',
    },
  };

  // Enhanced custom render rules for syntax highlighting
  const renderRules = {
    // Enhanced code block rendering with better language detection
    code_block: (node: { 
      key: string; 
      attributes?: { 
        class?: string; 
        language?: string; 
      }; 
      content: string; 
    }) => {
      // Extract language from the first line if it's a comment (like ```python)
      let language = 'text';
      if (node.attributes?.class) {
        const classMatch = node.attributes.class.match(/language-(\w+)/);
        if (classMatch) {
          language = classMatch[1];
        }
      } else if (node.attributes?.language) {
        language = node.attributes.language;
      }
      
      // Trim newlines from the end as per the original implementation
      let content = node.content;
      if (
        typeof node.content === 'string' &&
        node.content.charAt(node.content.length - 1) === '\n'
      ) {
        content = node.content.substring(0, node.content.length - 1);
      }
      
      return (
        <View key={`${messageId}-${partIndex}-code-${node.key}`} style={markdownStyles.code_block}>
          <SyntaxHighlighter
            hljsStyle={atomOneDarkReasonable}
            language={language}
            textStyle={{
              fontSize: 12,
            }}
          >
            {content.trim()}
          </SyntaxHighlighter>
        </View>
      );
    },
    fence: (node: { 
      key: string; 
      attributes?: { 
        info?: string; 
        language?: string; 
      }; 
      content: string; 
    }) => {
      // Extract language from the fence info string (like ```python)
      let language = 'text';
      if (node.attributes?.info) {
        language = node.attributes.info.split(' ')[0]; // Take first word as language
      } else if (node.attributes?.language) {
        language = node.attributes.language;
      }
      
      // Trim newlines from the end as per the original implementation
      let content = node.content;
      if (
        typeof node.content === 'string' &&
        node.content.charAt(node.content.length - 1) === '\n'
      ) {
        content = node.content.substring(0, node.content.length - 1);
      }
      
      return (
        <View key={`${messageId}-${partIndex}-fence-${node.key}`} style={markdownStyles.fence}>
          <SyntaxHighlighter
            hljsStyle={atomOneDarkReasonable}
            language={language}
            textStyle={{
              fontSize: 12,
            }}
          >
            {content.trim()}
          </SyntaxHighlighter>
        </View>
      );
    },
  };



  // Handle link press
  const handleLinkPress = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(error => {
      console.error('Error opening link:', error);
    });
    return false;
  };

  return (
    <View style={styles.container}>
      {isMarkdown ? (
        <Markdown
          style={markdownStyles}
          rules={renderRules}
          mergeStyle={true}
          onLinkPress={handleLinkPress}
          markdownit={markdownItInstance}
        >
          {displayContent}
        </Markdown>
      ) : (
        <FileMentionContent
          content={displayContent}
          onFileMentionPress={(filePath) => {
            console.log('File mention pressed:', filePath);
            // TODO: Handle file mention press (e.g., open file details)
          }}
          selectable={true}
        />
      )}

      {shouldShowExpandButton && (
        <ExpandButton
          isExpanded={isExpanded}
          onPress={toggleExpanded}
          expandText="Show more"
          collapseText="Show less"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
});