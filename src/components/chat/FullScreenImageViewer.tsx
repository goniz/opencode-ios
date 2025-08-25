import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface FullScreenImageViewerProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function FullScreenImageViewer({
  visible,
  imageUri,
  onClose,
}: FullScreenImageViewerProps) {
  console.log('FullScreenImageViewer props:', { visible, imageUri });
  
  const handleClose = () => {
    console.log('Closing full screen image viewer');
    onClose();
  };

  if (!visible || !imageUri) {
    console.log('FullScreenImageViewer not showing:', { visible, imageUri });
    return null;
  }

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.imageContainer}
            activeOpacity={1}
            onPress={handleClose}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
              placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
});