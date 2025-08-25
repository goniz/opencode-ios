import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImagePreview } from '../../../src/components/chat/ImagePreview';

// Mock expo modules
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the FullScreenImageViewer component
jest.mock('../../../src/components/chat/FullScreenImageViewer', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    FullScreenImageViewer: ({ visible, imageUri }: { visible: boolean; imageUri: string }) => (
      <View 
        testID="full-screen-viewer"
        accessibilityState={{ busy: visible }}
        accessibilityValue={{ text: imageUri }}
      />
    ),
  };
});

describe('ImagePreview', () => {
  const mockOnRemoveImage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when no images are provided', () => {
    const { queryByTestId } = render(
      <ImagePreview images={[]} onRemoveImage={mockOnRemoveImage} />
    );
    
    expect(queryByTestId('image-preview-container')).toBeNull();
  });

  it('renders images when provided', () => {
    const images = ['file://test-image1.jpg', 'file://test-image2.jpg'];
    const { getByTestId, getAllByTestId } = render(
      <ImagePreview images={images} onRemoveImage={mockOnRemoveImage} />
    );
    
    // Check that the container is rendered
    expect(getByTestId('image-preview-container')).toBeTruthy();
    
    // Check that images are rendered
    const imageElements = getAllByTestId('preview-image');
    expect(imageElements).toHaveLength(2);
  });

  it('renders base64 data URLs correctly', () => {
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const images = [base64Image];
    const { getByTestId } = render(
      <ImagePreview images={images} onRemoveImage={mockOnRemoveImage} />
    );
    
    // Check that the container is rendered
    expect(getByTestId('image-preview-container')).toBeTruthy();
    
    // Check that the image is rendered
    expect(getByTestId('preview-image')).toBeTruthy();
  });

  it('shows full screen viewer when image is clicked', () => {
    const images = ['file://test-image.jpg'];
    const { getByTestId, getAllByTestId } = render(
      <ImagePreview images={images} onRemoveImage={mockOnRemoveImage} />
    );
    
    // Click on the image
    const imageElement = getAllByTestId('preview-image-touchable')[0];
    fireEvent.press(imageElement);
    
    // Check that full screen viewer is shown
    const fullScreenViewer = getByTestId('full-screen-viewer');
    expect(fullScreenViewer.props.accessibilityState.busy).toBe(true);
    expect(fullScreenViewer.props.accessibilityValue.text).toBe('file://test-image.jpg');
  });

  it('shows full screen viewer with base64 data URL when clicked', () => {
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const images = [base64Image];
    const { getByTestId, getAllByTestId } = render(
      <ImagePreview images={images} onRemoveImage={mockOnRemoveImage} />
    );
    
    // Click on the image
    const imageElement = getAllByTestId('preview-image-touchable')[0];
    fireEvent.press(imageElement);
    
    // Check that full screen viewer is shown with correct image URI
    const fullScreenViewer = getByTestId('full-screen-viewer');
    expect(fullScreenViewer.props.accessibilityState.busy).toBe(true);
    expect(fullScreenViewer.props.accessibilityValue.text).toBe(base64Image);
  });

  it('calls onRemoveImage when remove button is pressed', () => {
    const images = ['file://test-image.jpg'];
    const { getAllByTestId } = render(
      <ImagePreview images={images} onRemoveImage={mockOnRemoveImage} />
    );
    
    // Click on the remove button
    const removeButton = getAllByTestId('remove-image-button')[0];
    fireEvent.press(removeButton);
    
    // Check that onRemoveImage was called with correct index
    expect(mockOnRemoveImage).toHaveBeenCalledWith(0);
  });
});