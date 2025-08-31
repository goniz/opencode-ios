import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MessagePartProps, MessagePartContainer, getRenderMode, getMessagePartStyles } from './MessagePart';
import { useExpandable } from '../../../hooks/useExpandable';
import { ExpandButton } from '../ExpandButton';
import { FullScreenImageViewer } from '../FullScreenImageViewer';
import { getFileTypeInfo } from '../../../utils/fileTypeDetection';

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
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  
  const filePart = part as FilePartData;
  
  // Get file info from different possible sources
  const filePath = filePart.file?.path || filePart.source?.path || filePart.filename || 'Unknown file';
  const fileContent = filePart.file?.content || filePart.source?.text?.value || '';
  const mimeType = filePart.mime || '';
  const fileUrl = filePart.url || '';
  
  // Extract filename
  const fileName = filePath.split('/').pop() || filePath;
  const fileTypeInfo = getFileTypeInfo(fileName, mimeType);
  
  // Check if this is an image file
  const isImage = mimeType.startsWith('image/') || 
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif'].some(ext => 
      filePath.toLowerCase().endsWith(`.${ext}`)
    );
     
  // Check if we have a valid URL for rendering
  const hasValidUrl = Boolean(fileUrl && fileUrl.trim() !== '') && 
    (fileUrl.startsWith('http') || fileUrl.startsWith('file://') || fileUrl.startsWith('data:'));
   
  // For user messages with local files, check if we can render them directly
  const isLocalImage = messageRole === 'user' && 
    !hasValidUrl && 
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'].some(ext => 
      filePath.toLowerCase().endsWith(`.${ext}`)
    );
  
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
  
  // USER MESSAGE BUBBLE - Simple format: [TYPE] filename
  if (messageRole === 'user' && actualRenderMode === 'bubble') {
    return (
      <View style={getMessagePartStyles({ messageRole: 'user', renderMode: 'bubble' }).fileContainer}>
        <Text style={styles.userFileText}>
          [{fileTypeInfo.icon}] {fileName}
        </Text>
        
        {/* Show image preview for images */}
        {(isImage && hasValidUrl) || isLocalImage ? (
          <TouchableOpacity 
            onPress={() => setImageViewerVisible(true)}
            style={styles.userImageContainer}
          >
            <Image
              source={{ uri: hasValidUrl ? fileUrl : `file://${filePath}` }}
              style={styles.userImagePreview}
              contentFit="cover"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        ) : null}
        
        <FullScreenImageViewer
          visible={imageViewerVisible}
          imageUri={hasValidUrl ? fileUrl : `file://${filePath}`}
          onClose={() => setImageViewerVisible(false)}
        />
      </View>
    );
  }

  // Fallback if no content is available
  if (!filePath && !fileContent && !fileUrl) {
    return null;
  }

  // ASSISTANT MESSAGE - Expanded format
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isCodeFile = ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'css', 'html', 'json'].includes(fileExtension);

  return (
    <MessagePartContainer>
      <View style={styles.container}>
        {/* File header */}
        <View style={styles.header}>
          <View style={styles.fileIconContainer}>
            <Text style={styles.fileIconText}>[{fileTypeInfo.icon}]</Text>
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.filePath}>{filePath}</Text>
          </View>
        </View>

        {/* Image content */}
        {isImage && hasValidUrl && (
          <TouchableOpacity onPress={() => setImageViewerVisible(true)}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: fileUrl }}
                style={styles.image}
                contentFit="contain"
                placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
                cachePolicy="memory-disk"
              />
            </View>
          </TouchableOpacity>
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
        
        <FullScreenImageViewer
          visible={imageViewerVisible}
          imageUri={hasValidUrl ? fileUrl : `file://${filePath}`}
          onClose={() => setImageViewerVisible(false)}
        />
      </View>
    </MessagePartContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // USER MESSAGE STYLES - Simple and clean
  userFileText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  userImageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  userImagePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  
  // ASSISTANT MESSAGE STYLES - Expanded format
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
    marginRight: 10,
  },
  fileIconText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 2,
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
});