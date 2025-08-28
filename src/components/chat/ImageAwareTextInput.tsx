import React, { useState, useCallback } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { semanticColors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { layout } from '../../styles/layout';
import { SmartTextInput } from './SmartTextInput';
import { CommandMenuButton } from './CommandMenuButton';
import type { CommandSuggestion } from '../../utils/commandMentions';
import type { Command } from '../../api/types.gen';
import type { BuiltInCommand } from '../../types/commands';

interface ImageAwareTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onImageSelected?: (imageUri: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onCommandSelect?: (command: CommandSuggestion) => void;
  onMenuCommandSelect?: (command: BuiltInCommand | Command) => void;
  userCommands?: Command[];
  disabled?: boolean;
}

export function ImageAwareTextInput({ 
  value, 
  onChangeText, 
  onImageSelected,
  onSelectionChange,
  onCommandSelect,
  onMenuCommandSelect,
  userCommands = [],
  disabled = false,
  ...textInputProps 
}: ImageAwareTextInputProps) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const handlePasteImage = useCallback(async () => {
    try {
      // Check if clipboard has an image
      const hasImage = await Clipboard.hasImageAsync();
      
      if (hasImage) {
        // Try different formats to see what works best
        let imageData = await Clipboard.getImageAsync({ format: 'png' });
        let requestedFormat = 'png';
        
        // If PNG doesn't work, try JPEG
        if (!imageData || !imageData.data) {
          console.log('PNG format failed, trying JPEG...');
          imageData = await Clipboard.getImageAsync({ format: 'jpeg' });
          requestedFormat = 'jpeg';
        }
        
        if (imageData && onImageSelected) {
          console.log('Clipboard image data received:', {
            dataType: typeof imageData.data,
            dataLength: imageData.data?.length,
            dataPrefix: imageData.data?.substring(0, 50),
            requestedFormat
          });
          
          // Validate that we have actual data
          if (!imageData.data || imageData.data.trim() === '') {
            throw new Error('Clipboard image data is empty');
          }
          
          // Check if the data is already a complete data URI
          let dataUri: string;
          if (imageData.data.startsWith('data:')) {
            // Data already includes data URI prefix
            dataUri = imageData.data;
          } else {
            // Need to add data URI prefix to base64 data
            // Use the format we requested (PNG or JPEG)
            const mimeType = requestedFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
            dataUri = `data:${mimeType};base64,${imageData.data}`;
          }
          
          console.log('Created data URI for clipboard image:', {
            uriLength: dataUri.length,
            uriPrefix: dataUri.substring(0, 50)
          });
          
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
    console.log('handleSelectImage called');
    if (isImagePickerOpen) return;
    setIsImagePickerOpen(true);

    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission result:', permissionResult);
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photo library is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected from library:', imageUri);
        if (onImageSelected) {
          onImageSelected(imageUri);
        } else {
          console.log('No onImageSelected callback provided');
        }
      } else {
        console.log('Image selection cancelled or no assets');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsImagePickerOpen(false);
    }
  }, [isImagePickerOpen, onImageSelected]);

  const handleCameraImage = useCallback(async () => {
    if (isImagePickerOpen) return;
    setIsImagePickerOpen(true);

    try {
      // Request permission to access camera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera is required');
        return;
      }

      // Launch camera
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
      setIsImagePickerOpen(false);
    }
  }, [isImagePickerOpen, onImageSelected]);

  const showImageOptions = useCallback(() => {
    console.log('showImageOptions called');
    Alert.alert(
      'Add Image',
      'Choose how to add an image',
      [
        {
          text: 'Camera',
          onPress: () => {
            console.log('Camera option selected');
            handleCameraImage();
          },
        },
        {
          text: 'Photo Library',
          onPress: () => {
            console.log('Photo Library option selected');
            handleSelectImage();
          },
        },
        {
          text: 'Paste from Clipboard',
          onPress: () => {
            console.log('Paste from Clipboard option selected');
            handlePasteImage();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Image selection cancelled'),
        },
      ]
    );
  }, [handleCameraImage, handleSelectImage, handlePasteImage]);

  return (
    <View style={styles.container}>
      <SmartTextInput
        {...textInputProps}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        onCommandSelect={onCommandSelect}
        style={[{ marginRight: 0 }, textInputProps.style]}
      />
      
      <CommandMenuButton
        onCommandSelect={onMenuCommandSelect || (() => {})}
        userCommands={userCommands}
        disabled={disabled}
      />
      
      <TouchableOpacity
        style={styles.imageButton}
        onPress={() => {
          console.log('Image button pressed, disabled:', isImagePickerOpen);
          showImageOptions();
        }}
        disabled={isImagePickerOpen}
        testID="image-button"
      >
        <Ionicons 
          name="image-outline" 
          size={20} 
          color={isImagePickerOpen ? semanticColors.textMuted : semanticColors.textPrimary} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  imageButton: {
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
});
