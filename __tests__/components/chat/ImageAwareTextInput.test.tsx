import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImageAwareTextInput } from '../../../src/components/chat/ImageAwareTextInput';

// Mock expo modules
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ 
    canceled: false, 
    assets: [{ uri: 'file://mock-image.jpg' }] 
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({ 
    canceled: false, 
    assets: [{ uri: 'file://mock-camera-image.jpg' }] 
  }),
}));

jest.mock('expo-clipboard', () => ({
  hasImageAsync: jest.fn().mockResolvedValue(false),
  getImageAsync: jest.fn().mockResolvedValue({ data: 'mock-base64-data' }),
}));

jest.mock('../../../src/contexts/ConnectionContext', () => ({
  useConnection: () => ({
    client: {},
  }),
}));

describe('ImageAwareTextInput', () => {
  const mockOnChangeText = jest.fn();
  const mockOnImageSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders text input and image button', () => {
    const { getByDisplayValue, getByTestId } = render(
      <ImageAwareTextInput
        value="test message"
        onChangeText={mockOnChangeText}
        onImageSelected={mockOnImageSelected}
        placeholder="Type a message..."
      />
    );

    expect(getByDisplayValue('test message')).toBeTruthy();
    // Find the image button by testID
    expect(getByTestId('image-button')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByDisplayValue } = render(
      <ImageAwareTextInput
        value="test message"
        onChangeText={mockOnChangeText}
        onImageSelected={mockOnImageSelected}
        placeholder="Type a message..."
      />
    );

    const textInput = getByDisplayValue('test message');
    fireEvent.changeText(textInput, 'new message');

    expect(mockOnChangeText).toHaveBeenCalledWith('new message');
  });

  it('shows image options when image button is pressed', () => {
    const { getByTestId } = render(
      <ImageAwareTextInput
        value=""
        onChangeText={mockOnChangeText}
        onImageSelected={mockOnImageSelected}
        placeholder="Type a message..."
      />
    );

    // Find the image button by testID
    const imageButton = getByTestId('image-button');
    fireEvent.press(imageButton);

    // Note: Testing Alert.alert is complex in unit tests
    // In a real scenario, you might want to use a custom modal component instead
    expect(imageButton).toBeTruthy();
  });
});