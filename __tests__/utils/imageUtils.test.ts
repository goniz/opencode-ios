// Test utilities for image MIME type detection
// These functions are extracted from ConnectionContext for testing

const detectMimeTypeFromUri = (uri: string): string => {
  const extension = uri.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'image/png';
  }
};

const detectMimeTypeFromDataUri = (dataUri: string): string => {
  const mimeMatch = dataUri.match(/^data:([^;]+);base64,/);
  return mimeMatch ? mimeMatch[1] : 'image/png';
};

const validateImageMimeType = (mimeType: string): string => {
  const validImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff'
  ];
  
  // Normalize jpeg variants
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  
  return validImageTypes.includes(mimeType) ? mimeType : 'image/png';
};

describe('Image MIME Type Detection', () => {
  describe('detectMimeTypeFromUri', () => {
    test('detects JPEG from .jpg extension', () => {
      expect(detectMimeTypeFromUri('file:///path/image.jpg')).toBe('image/jpeg');
    });

    test('detects JPEG from .jpeg extension', () => {
      expect(detectMimeTypeFromUri('file:///path/image.jpeg')).toBe('image/jpeg');
    });

    test('detects PNG from .png extension', () => {
      expect(detectMimeTypeFromUri('file:///path/image.png')).toBe('image/png');
    });

    test('detects WebP from .webp extension', () => {
      expect(detectMimeTypeFromUri('file:///path/image.webp')).toBe('image/webp');
    });

    test('defaults to PNG for unknown extensions', () => {
      expect(detectMimeTypeFromUri('file:///path/image.xyz')).toBe('image/png');
    });

    test('handles case-insensitive extensions', () => {
      expect(detectMimeTypeFromUri('file:///path/IMAGE.JPG')).toBe('image/jpeg');
      expect(detectMimeTypeFromUri('file:///path/photo.PNG')).toBe('image/png');
      expect(detectMimeTypeFromUri('file:///path/animation.GIF')).toBe('image/gif');
      expect(detectMimeTypeFromUri('file:///path/modern.WEBP')).toBe('image/webp');
      expect(detectMimeTypeFromUri('file:///path/bitmap.BMP')).toBe('image/bmp');
      expect(detectMimeTypeFromUri('file:///path/vector.SVG')).toBe('image/svg+xml');
      expect(detectMimeTypeFromUri('file:///path/document.TIFF')).toBe('image/tiff');
    });

    test('handles mixed case extensions', () => {
      expect(detectMimeTypeFromUri('file:///path/MyPhoto.Png')).toBe('image/png');
      expect(detectMimeTypeFromUri('file:///path/SCREENSHOT.jpeg')).toBe('image/jpeg');
      expect(detectMimeTypeFromUri('file:///path/Icon.WebP')).toBe('image/webp');
    });
  });

  describe('detectMimeTypeFromDataUri', () => {
    test('detects MIME type from data URI', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
      expect(detectMimeTypeFromDataUri(dataUri)).toBe('image/jpeg');
    });

    test('defaults to PNG for invalid data URI', () => {
      expect(detectMimeTypeFromDataUri('invalid-uri')).toBe('image/png');
    });
  });

  describe('validateImageMimeType', () => {
    test('normalizes image/jpg to image/jpeg', () => {
      expect(validateImageMimeType('image/jpg')).toBe('image/jpeg');
    });

    test('keeps valid MIME types unchanged', () => {
      expect(validateImageMimeType('image/png')).toBe('image/png');
      expect(validateImageMimeType('image/webp')).toBe('image/webp');
    });

    test('defaults to PNG for invalid MIME types', () => {
      expect(validateImageMimeType('invalid/type')).toBe('image/png');
    });
  });

  describe('Filename Extraction', () => {
    const extractFilenameFromUri = (uri: string, mimeType: string): string => {
      if (uri.startsWith('file://')) {
        const parts = uri.split('/');
        const filename = parts[parts.length - 1];
        if (filename && filename.includes('.')) {
          return filename;
        }
      }
      
      const getExtensionFromMimeType = (mime: string): string => {
        switch (mime) {
          case 'image/jpeg': return 'jpg';
          case 'image/png': return 'png';
          case 'image/gif': return 'gif';
          case 'image/webp': return 'webp';
          case 'image/bmp': return 'bmp';
          case 'image/svg+xml': return 'svg';
          case 'image/tiff': return 'tiff';
          default: return 'png';
        }
      };
      
      const extension = getExtensionFromMimeType(mimeType);
      const timestamp = new Date().getTime();
      return `image_${timestamp}.${extension}`;
    };

    test('preserves original filename with uppercase extension', () => {
      const filename = extractFilenameFromUri('file:///path/MyPhoto.PNG', 'image/png');
      expect(filename).toBe('MyPhoto.PNG');
    });

    test('preserves original filename with mixed case', () => {
      const filename = extractFilenameFromUri('file:///path/Screenshot.Jpeg', 'image/jpeg');
      expect(filename).toBe('Screenshot.Jpeg');
    });

    test('generates filename with correct extension from MIME type', () => {
      const filename = extractFilenameFromUri('data:image/png;base64,...', 'image/png');
      expect(filename).toMatch(/^image_\d+\.png$/);
    });

    test('MIME detection is case-insensitive but filename is preserved', () => {
      // Test that MIME type detection works regardless of case
      const upperCaseUri = 'file:///photos/VACATION.PNG';
      const detectedMime = detectMimeTypeFromUri(upperCaseUri);
      const filename = extractFilenameFromUri(upperCaseUri, detectedMime);
      
      expect(detectedMime).toBe('image/png'); // MIME detection should be lowercase
      expect(filename).toBe('VACATION.PNG');  // Filename should preserve original case
    });
  });
});