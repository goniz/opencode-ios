import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface ImagePreviewProps {
  images: string[];
  onRemoveImage: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const imageSize = Math.min(120, (screenWidth - 64) / 3); // 3 images per row with padding

export function ImagePreview({ images, onRemoveImage }: ImagePreviewProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((imageUri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
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
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
  },
});