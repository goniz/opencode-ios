import React, { useState, useCallback } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Text,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';
import { secureSettings } from '../../utils/secureSettings';

interface AttachMenuProps {
  onImageSelected?: (imageUri: string) => void;
  disabled?: boolean;
}

interface AttachOption {
  key: string;
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export function AttachMenu({ 
  onImageSelected,
  disabled = false
}: AttachMenuProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  React.useEffect(() => {
    const loadGithubToken = async () => {
      try {
        const token = await secureSettings.getGitHubToken();
        setGithubToken(token);
      } catch (error) {
        console.error('Failed to load GitHub token:', error);
      }
    };
    loadGithubToken();
  }, []);

  // Reset stuck picker state on mount (prevents permanent disabled state)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsPickerOpen(prev => {
        if (prev) {
          console.log('Force resetting stuck picker state');
          return false;
        }
        return prev;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePasteImage = useCallback(async () => {
    setIsMenuVisible(false);
    try {
      const hasImage = await Clipboard.hasImageAsync();
      
      if (hasImage) {
        let imageData = await Clipboard.getImageAsync({ format: 'png' });
        let requestedFormat = 'png';
        
        if (!imageData || !imageData.data) {
          console.log('PNG format failed, trying JPEG...');
          imageData = await Clipboard.getImageAsync({ format: 'jpeg' });
          requestedFormat = 'jpeg';
        }
        
        if (imageData && onImageSelected) {
          console.log('Clipboard image data received:', {
            dataType: typeof imageData.data,
            dataLength: imageData.data?.length,
            requestedFormat
          });
          
          if (!imageData.data || imageData.data.trim() === '') {
            throw new Error('Clipboard image data is empty');
          }
          
          let dataUri: string;
          if (imageData.data.startsWith('data:')) {
            dataUri = imageData.data;
          } else {
            const mimeType = requestedFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
            dataUri = `data:${mimeType};base64,${imageData.data}`;
          }
          
          onImageSelected(dataUri);
        }
      } else {
        Alert.alert('No Image', 'No image found in clipboard');
      }
    } catch (error) {
      console.error('Error pasting image:', error);
      Alert.alert('Error', 'Failed to paste image from clipboard');
    }
  }, [onImageSelected]);

  const handleSelectImage = useCallback(async () => {
    setIsMenuVisible(false);
    if (isPickerOpen) return;
    setIsPickerOpen(true);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photo library is required');
        setIsPickerOpen(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', `Failed to select image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPickerOpen(false);
    }
  }, [isPickerOpen, onImageSelected]);

  const handleCameraImage = useCallback(async () => {
    setIsMenuVisible(false);
    if (isPickerOpen) return;
    setIsPickerOpen(true);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera is required');
        setIsPickerOpen(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsPickerOpen(false);
    }
  }, [isPickerOpen, onImageSelected]);

  const handleGithubAttach = useCallback(() => {
    setIsMenuVisible(false);
    Alert.alert('Coming Soon', 'GitHub integration is under development');
  }, []);

  const handleLocalFileAttach = useCallback(() => {
    setIsMenuVisible(false);
    Alert.alert('Coming Soon', 'Local file attachment is under development');
  }, []);

  const createAttachOptions = useCallback((): AttachOption[] => {
    const baseOptions: AttachOption[] = [
      {
        key: 'camera',
        label: 'Camera',
        icon: 'camera-outline',
        color: semanticColors.primary,
        onPress: handleCameraImage,
      },
      {
        key: 'gallery',
        label: 'Photo Library',
        icon: 'image-outline',
        color: semanticColors.primary,
        onPress: handleSelectImage,
      },
      {
        key: 'clipboard',
        label: 'Paste from Clipboard',
        icon: 'clipboard-outline',
        color: semanticColors.primary,
        onPress: handlePasteImage,
      },
      {
        key: 'localfile',
        label: 'Local File',
        icon: 'document-outline',
        color: semanticColors.textMuted,
        onPress: handleLocalFileAttach,
      }
    ];

    if (githubToken) {
      baseOptions.push({
        key: 'github',
        label: 'GitHub',
        icon: 'logo-github',
        color: semanticColors.success,
        onPress: handleGithubAttach,
      });
    }

    return baseOptions;
  }, [handleCameraImage, handleSelectImage, handlePasteImage, handleLocalFileAttach, handleGithubAttach, githubToken]);

  const handleOpenMenu = useCallback(() => {
    if (!disabled && !isPickerOpen) {
      setIsMenuVisible(true);
    } else if (isPickerOpen) {
      // If isPickerOpen is stuck, reset it
      console.log('Resetting stuck picker state');
      setIsPickerOpen(false);
    }
  }, [disabled, isPickerOpen]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const attachOptions = createAttachOptions();

  return (
    <>
      <TouchableOpacity
        style={[styles.attachButton, disabled && styles.attachButtonDisabled]}
        onPress={handleOpenMenu}
        disabled={disabled || isPickerOpen}
        testID="attach-menu-button"
      >
        <Ionicons 
          name="add" 
          size={20} 
          color={disabled || isPickerOpen ? semanticColors.textMuted : semanticColors.textPrimary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={handleCloseMenu}
            activeOpacity={1}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Attach</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseMenu}
                >
                  <Ionicons name="close" size={24} color={semanticColors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.optionsContainer}>
                {attachOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.optionButton}
                    onPress={option.onPress}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                      <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={24} color={option.color} />
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  attachButton: {
    backgroundColor: semanticColors.cardBackground,
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: layout.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    borderWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: semanticColors.background,
    borderTopLeftRadius: layout.borderRadius.lg,
    borderTopRightRadius: layout.borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: layout.borderWidth.DEFAULT,
    borderLeftWidth: layout.borderWidth.DEFAULT,
    borderRightWidth: layout.borderWidth.DEFAULT,
    borderColor: semanticColors.border,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: semanticColors.textPrimary,
  },
  closeButton: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  optionButton: {
    alignItems: 'center',
    minWidth: 80,
    paddingVertical: spacing.md,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: semanticColors.textPrimary,
    textAlign: 'center',
  },
});