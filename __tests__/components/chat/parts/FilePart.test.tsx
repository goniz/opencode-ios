import React from 'react';
import { render } from '@testing-library/react-native';
import { FilePart } from '../../../../src/components/chat/parts/FilePart';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock hooks
jest.mock('../../../../src/hooks/useExpandable', () => ({
  useExpandable: () => ({
    isExpanded: false,
    shouldShowExpandButton: false,
    displayContent: '',
    toggleExpanded: jest.fn(),
  }),
}));

describe('FilePart', () => {
  const mockPart = {
    id: 'test-id',
    type: 'file' as const,
    sessionID: 'session-1',
    messageID: 'message-1',
    mime: 'image/png',
    filename: 'test.png',
    url: 'data:image/png;base64,iVBOR...',
  };

  it('detects images with uppercase extensions', () => {
    const upperCasePart = {
      ...mockPart,
      filename: 'Photo.PNG',
      mime: 'text/plain', // Even if MIME is wrong, should detect from extension
    };

    const { getByText, getAllByText } = render(<FilePart part={upperCasePart} />);
    
    // Should show image icon instead of file icon
    expect(getByText('🖼️')).toBeTruthy();
    // Filename might appear multiple times (in header and path), so use getAllByText
    expect(getAllByText('Photo.PNG').length).toBeGreaterThan(0);
  });

  it('detects images with mixed case extensions', () => {
    const mixedCasePart = {
      ...mockPart,
      filename: 'Screenshot.Jpeg',
      mime: '', // Empty MIME type, rely on extension
    };

    const { getByText, getAllByText } = render(<FilePart part={mixedCasePart} />);
    
    // Should show image icon
    expect(getByText('🖼️')).toBeTruthy();
    expect(getAllByText('Screenshot.Jpeg').length).toBeGreaterThan(0);
  });

  it('prioritizes MIME type over extension for image detection', () => {
    const mimeTypePart = {
      ...mockPart,
      filename: 'document.txt', // Non-image extension
      mime: 'image/webp', // But image MIME type
    };

    const { getByText } = render(<FilePart part={mimeTypePart} />);
    
    // Should show image icon due to MIME type
    expect(getByText('🖼️')).toBeTruthy();
  });

  it('handles all supported image extensions case-insensitively', () => {
    const extensions = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF', 'TIF'];
    
    extensions.forEach(ext => {
      const part = {
        ...mockPart,
        filename: `image.${ext}`,
        mime: '', // Rely on extension detection
      };

      const { getByText } = render(<FilePart part={part} />);
      expect(getByText('🖼️')).toBeTruthy();
    });
  });
});