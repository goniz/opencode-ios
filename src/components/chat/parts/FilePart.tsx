import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MessagePartProps, MessagePartContainer, getRenderMode, getMessagePartStyles } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';

interface FilePartData {
  file?: {
    path?: string;
    content?: string;
  };
  source?: {
    path?: string;
    text?: {
      value?: string;
    };
  };
  filename?: string;
  mime?: string;
  url?: string;
}

export const FilePart: React.FC<MessagePartProps> = ({ 
  part, 
  isLast = false,
  messageRole = 'assistant',
  renderMode = 'auto'
}) => {
  const actualRenderMode = getRenderMode(renderMode, messageRole);
  
  // Handle both the MessagePartProps interface and actual API FilePart type
  const filePart = part as FilePartData;
  
  // Debug logging to see what data we're getting
  if (messageRole === 'user') {
    console.log('User FilePart data:', {
      filePart,
      hasUrl: Boolean(filePart.url),
      url: filePart.url,
      mime: filePart.mime,
      filename: filePart.filename,
      filePath: filePart.file?.path || filePart.source?.path || filePart.filename || 'Unknown file'
    });
  }
  
  // Try to get file info from different possible sources
  const filePath = filePart.file?.path || filePart.source?.path || filePart.filename || 'Unknown file';
  const fileContent = filePart.file?.content || filePart.source?.text?.value || '';
  const mimeType = filePart.mime || '';
  const fileUrl = filePart.url || '';
  
  // Check if this is an image file
  const isImage = mimeType.startsWith('image/') || 
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif'].some(ext => 
      filePath.toLowerCase().endsWith(`.${ext}`)
    );
    
  // For user messages, we might have image data in different formats
  // Check if we have a valid URL for rendering
  const hasValidUrl = Boolean(fileUrl && fileUrl.trim() !== '');
  
  // Extract content for the expandable hook
  let extractedFileContent = '';
  if ('content' in part && typeof part.content === 'string') {
    extractedFileContent = part.content;
  }
  
  // Always call useExpandable hook to maintain hook order
  const expandableResult = useExpandable({
    content: extractedFileContent,
    autoExpand: isLast || (extractedFileContent ? extractedFileContent.length < 500 : false),
    contentType: 'text',
    maxLines: 10,
    estimatedCharsPerLine: 60,
  });

  const {
    isExpanded,
    shouldShowExpandButton,
    displayContent,
    toggleExpanded,
  } = expandableResult;
  
  if (messageRole === 'user' && actualRenderMode === 'bubble') {
    return (
      <View style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).fileContainer}>
        <View style={styles.userFileHeader}>
          <Text style={styles.fileIcon}>{isImage ? '🖼️' : '📄'}</Text>
          <Text style={styles.userFileName} numberOfLines={1}>
            {filePath.split('/').pop() || filePath}
          </Text>
        </View>
        {isImage && hasValidUrl && (
          <Image
            source={{ uri: fileUrl }}
            style={styles.userImagePreview}
            contentFit="cover"
          />
        )}
      </View>
    );
  }

  // Fallback if no content is available
  if (!filePath && !fileContent && !fileUrl) {
    return null;
  }

  // Extract file name from path
  const fileName = filePath ? filePath.split('/').pop() || filePath : 'Unknown file';
  
  // Simple file extension detection for styling
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isCodeFile = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'css', 'html', 'json'].includes(fileExtension);

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* File header */}
        <View style={styles.header}>
<View style={styles.fileIconContainer}>
  <Text style={styles.fileIconText}>{isImage ? '🖼️' : '📄'}</Text>
</View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.filePath}>{filePath}</Text>
          </View>
        </View>

        {/* Image content */}
        {isImage && fileUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.image}
              contentFit="contain"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
            />
          </View>
        )}

        {/* File content */}
        {!isImage && fileContent && (
          <View style={styles.contentContainer}>
            <Text style={[
              styles.contentText,
              isCodeFile && styles.codeText
            ]}>
              {displayContent}
            </Text>
            
            {shouldShowExpandButton && (
              <ExpandButton
                isExpanded={isExpanded}
                onPress={toggleExpanded}
                expandText="Show full file"
                collapseText="Show less"
              />
            )}
          </View>
        )}
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
  },
  fileIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileIconText: {
    fontSize: 14,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 1,
  },
  filePath: {
    fontSize: 11,
    color: '#9ca3af',
  },
  contentContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  contentText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#d1d5db',
  },
  codeText: {
    fontFamily: 'monospace',
  },
  imageContainer: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    alignSelf: 'flex-start',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  
  // User bubble mode styles
  userFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fileIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  userFileName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '400',
    flex: 1,
  },
  userImagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
});