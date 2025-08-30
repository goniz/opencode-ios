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
import { GitHubPicker } from '../../integrations/github';
import { FilePartLike } from '../../integrations/github/GitHubTypes';
import type { Client } from '../../api/client/types.gen';

interface AttachMenuProps {
  onImageSelected?: (imageUri: string) => void;
  onFileAttached?: (filePart: FilePartLike) => void;
  disabled?: boolean;
  client?: Client | null;
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
  onFileAttached,
  disabled = false,
  client = null
}: AttachMenuProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [isGithubPickerVisible, setIsGithubPickerVisible] = useState(false);

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
    if (isLoading) return;

    setIsMenuVisible(false);
    
    // Add a small delay to ensure menu closes before setting loading
    setTimeout(() => setIsLoading(true), 100);

    // Safety timeout to reset loading state
    const timeoutId = setTimeout(() => {
      console.log('Image picker timeout - resetting loading state');
      setIsLoading(false);
    }, 30000); // 30 second timeout

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photo library is required');
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
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [isLoading, onImageSelected]);

  const handleCameraImage = useCallback(async () => {
    if (isLoading) return;

    setIsMenuVisible(false);
    
    // Add a small delay to ensure menu closes before setting loading
    setTimeout(() => setIsLoading(true), 100);

    // Safety timeout to reset loading state
    const timeoutId = setTimeout(() => {
      console.log('Camera timeout - resetting loading state');
      setIsLoading(false);
    }, 30000); // 30 second timeout

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera is required');
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
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [isLoading, onImageSelected]);

  const handleGithubAttach = useCallback(() => {
    setIsMenuVisible(false);
    setIsGithubPickerVisible(true);
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
    if (!disabled && !isLoading) {
      setIsMenuVisible(true);
    }
  }, [disabled, isLoading]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleGithubPickerClose = useCallback(() => {
    setIsGithubPickerVisible(false);
  }, []);

  const handleGithubAttachFile = useCallback((filePart: FilePartLike) => {
    if (onFileAttached) {
      onFileAttached(filePart);
    }
    setIsGithubPickerVisible(false);
  }, [onFileAttached]);

  const attachOptions = createAttachOptions();

  return (
    <>
      <TouchableOpacity
        style={[styles.attachButton, (disabled || isLoading) && styles.attachButtonDisabled]}
        onPress={handleOpenMenu}
        disabled={disabled || isLoading}
        testID="attach-menu-button"
      >
        <Ionicons
          name={isLoading ? "hourglass-outline" : "add"}
          size={20}
          color={(disabled || isLoading) ? semanticColors.textMuted : semanticColors.textPrimary}
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

      {githubToken && client && (
        <GitHubPicker
          visible={isGithubPickerVisible}
          onClose={handleGithubPickerClose}
          onAttach={handleGithubAttachFile}
          githubToken={githubToken}
          client={client}
        />
      )}
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