import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FullScreenImageViewer } from './FullScreenImageViewer';

interface ImagePreviewProps {
  images: string[];
  onRemoveImage: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const imageSize = Math.min(80, (screenWidth - 64) / 4); // 4 images per row with padding

export function ImagePreview({ images, onRemoveImage }: ImagePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="image-preview-container">
      <FlatList 
        data={images}
        renderItem={({ item: imageUri, index }) => (
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              testID="preview-image-touchable"
              onPress={() => {
                console.log('IMAGEPREVIEW CLICKED');
                setSelectedImage(imageUri);
              }}
              activeOpacity={0.7}
            >
              <Image
                testID="preview-image"
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
                placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
                cachePolicy="memory-disk"
                onError={() => console.warn('Failed to load image:', imageUri)}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="remove-image-button"
              style={styles.removeButton}
              onPress={() => onRemoveImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => `image-${index}-${item}`}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
      
      <FullScreenImageViewer
        visible={!!selectedImage}
        imageUri={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#0d0d0d',
  },
  scrollContent: {
    paddingRight: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
});