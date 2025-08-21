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
import { FileAwareTextInput } from './FileAwareTextInput';

interface ImageAwareTextInputProps extends Omit<TextInputProps, 'onChangeText' | 'onSelectionChange'> {
  value: string;
  onChangeText: (text: string) => void;
  onImageSelected?: (imageUri: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
}

export function ImageAwareTextInput({ 
  value, 
  onChangeText, 
  onImageSelected,
  onSelectionChange,
  ...textInputProps 
}: ImageAwareTextInputProps) {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const handlePasteImage = useCallback(async () => {
    try {
      // Check if clipboard has an image
      const hasImage = await Clipboard.hasImageAsync();
      
      if (hasImage) {
        const imageData = await Clipboard.getImageAsync({ format: 'png' });
        
        if (imageData && onImageSelected) {
          // Create a data URI from the base64 data
          const dataUri = `data:image/png;base64,${imageData.data}`;
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
      <FileAwareTextInput
        {...textInputProps}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        style={[{ marginRight: 0 }, textInputProps.style]}
      />
      
      <TouchableOpacity
        style={styles.imageButton}
        onPress={() => {
          console.log('Image button pressed, disabled:', isImagePickerOpen);
          showImageOptions();
        }}
        disabled={isImagePickerOpen}
      >
        <Ionicons 
          name="image-outline" 
          size={20} 
          color={isImagePickerOpen ? "#6b7280" : "#ffffff"} 
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
    backgroundColor: '#2a2a2a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
});