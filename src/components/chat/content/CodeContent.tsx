import React from 'react';
import { View, StyleSheet } from 'react-native';
import SyntaxHighlighter from 'react-native-code-highlighter';
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

export interface CodeContentProps {
  code: string;
  language?: string;
  fileName?: string;
  isLast?: boolean;
}

export const CodeContent: React.FC<CodeContentProps> = ({
  code,
  language = 'text',
  fileName,
  isLast = false,
}) => {
  // Use expandable hook for code content
  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = useExpandable({
    content: code,
    autoExpand: isLast,
    contentType: 'code',
  });

  // Get file extension for language detection if not provided
  const detectedLanguage = language === 'text' && fileName 
    ? fileName.split('.').pop()?.toLowerCase() || 'text'
    : language;

  return (
    <View style={styles.container}>
      {/* File header if fileName is provided */}
      {fileName && (
        <View style={styles.header}>
          <View style={styles.fileInfo}>
            <View style={styles.fileIcon}>
              <View style={styles.fileIconInner} />
            </View>
            <View>
              <View style={styles.fileNameContainer}>
                <View style={styles.fileExtensionBadge}>
                  <View style={styles.fileExtensionBadgeInner} />
                </View>
                <View style={styles.fileNameTextContainer}>
                  <View style={styles.fileNameBackground}>
                    <View style={styles.fileNameTextInner} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Code content */}
      <View style={styles.codeContainer}>
        <SyntaxHighlighter
          hljsStyle={atomOneDarkReasonable}
          textStyle={styles.codeText}
          language={detectedLanguage}
        >
          {displayContent}
        </SyntaxHighlighter>
        
        {shouldShowExpandButton && (
          <ExpandButton
            isExpanded={isExpanded}
            onPress={toggleExpanded}
            expandText="Show full code"
            collapseText="Show less"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  fileIconInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6b7280',
    borderRadius: 2,
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileExtensionBadge: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  fileExtensionBadgeInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  fileNameTextContainer: {
    height: 16,
    minWidth: 80,
  },
  fileNameBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 4,
  },
  fileNameTextInner: {
    width: '60%',
    height: '60%',
    backgroundColor: '#9ca3af',
    borderRadius: 2,
    marginLeft: 6,
    marginTop: 3,
  },
  codeContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  codeBlock: {
    padding: 0,
    margin: 0,
  },
  codeText: {
    fontSize: 12,
  },
});