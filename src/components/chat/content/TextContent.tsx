import React from 'react';
import { View, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export interface TextContentProps {
  content: string;
  isMarkdown?: boolean;
  isLast?: boolean;
  variant?: 'default' | 'user' | 'assistant';
}

const rules = {
  body: {
    color: '#e5e7eb',
  },
  paragraph: {
    marginVertical: 4,
  },
  heading1: {
    color: '#e5e7eb',
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 12,
  },
  heading2: {
    color: '#e5e7eb',
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 10,
  },
  heading3: {
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },
  link: {
    color: '#60a5fa',
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
    color: '#d1d5db',
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
    backgroundColor: '#374151',
    borderLeftColor: '#4b5563',
    borderLeftWidth: 4,
    padding: 8,
    marginVertical: 8,
  },
};

export const TextContent: React.FC<TextContentProps> = ({
  content,
  isMarkdown = false,
  isLast = false,
  variant = 'default',
}) => {
  // Use expandable hook for content management
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content,
    maxLines: 3,
    autoExpand: isLast,
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

  // Combine default rules with variant-specific styles
  const markdownRules = {
    ...rules,
    body: {
      ...rules.body,
      ...variantStyles,
    },
  };

  return (
    <View style={styles.container}>
      {isMarkdown ? (
        <Markdown
          style={markdownRules}
          mergeStyle={true}
        >
          {displayContent}
        </Markdown>
      ) : (
        <Markdown
          style={{
            body: {
              color: variantStyles.color,
              fontSize: 14,
              lineHeight: 20,
            },
            paragraph: {
              marginVertical: 0,
            },
          }}
          mergeStyle={true}
        >
          {displayContent}
        </Markdown>
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
    flex: 1,
  },
});