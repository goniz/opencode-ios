import {
  detectMimeTypeFromUri,
  detectMimeTypeFromDataUri,
  validateImageMimeType,
  extractFilenameFromUri,
  processImageUri,
  processImageUris,
  blobToBase64
} from '../../src/utils/imageProcessing';

// Mock global fetch for file URI processing
global.fetch = jest.fn();

// Mock FileReader for blob to base64 conversion
global.FileReader = class MockFileReader {
  result: string | null = null;
  onload: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  readAsDataURL(blob: Blob) {
    // Simulate reading a blob and converting to data URL
    setTimeout(() => {
      // Mock different blob types
      if (blob.type === 'image/jpeg') {
        this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      } else if (blob.type === 'image/png') {
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      } else if (blob.type === 'image/webp') {
        this.result = 'data:image/webp;base64,UklGRhoBAABXRUJQVlA4IA4AAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
      } else {
        // Default to PNG for empty or unknown blob types
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      }
      if (this.onload) {
        this.onload({});
      }
    }, 0);
  }
} as any;

describe('Image Processing Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

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

    test('detects GIF from .gif extension', () => {
      expect(detectMimeTypeFromUri('file:///path/animation.gif')).toBe('image/gif');
    });

    test('detects BMP from .bmp extension', () => {
      expect(detectMimeTypeFromUri('file:///path/bitmap.bmp')).toBe('image/bmp');
    });

    test('detects SVG from .svg extension', () => {
      expect(detectMimeTypeFromUri('file:///path/vector.svg')).toBe('image/svg+xml');
    });

    test('detects TIFF from .tiff and .tif extensions', () => {
      expect(detectMimeTypeFromUri('file:///path/document.tiff')).toBe('image/tiff');
      expect(detectMimeTypeFromUri('file:///path/scan.tif')).toBe('image/tiff');
    });

    test('defaults to PNG for unknown extensions', () => {
      expect(detectMimeTypeFromUri('file:///path/image.xyz')).toBe('image/png');
      expect(detectMimeTypeFromUri('file:///path/file')).toBe('image/png');
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
    test('detects MIME type from PNG data URI', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...';
      expect(detectMimeTypeFromDataUri(dataUri)).toBe('image/png');
    });

    test('detects MIME type from JPEG data URI', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
      expect(detectMimeTypeFromDataUri(dataUri)).toBe('image/jpeg');
    });

    test('detects MIME type from WebP data URI', () => {
      const dataUri = 'data:image/webp;base64,UklGRhoBAABXRUJQVlA4IA4...';
      expect(detectMimeTypeFromDataUri(dataUri)).toBe('image/webp');
    });

    test('detects MIME type from GIF data URI', () => {
      const dataUri = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAA...';
      expect(detectMimeTypeFromDataUri(dataUri)).toBe('image/gif');
    });

    test('defaults to PNG for invalid data URI', () => {
      expect(detectMimeTypeFromDataUri('invalid-uri')).toBe('image/png');
      expect(detectMimeTypeFromDataUri('data:text/plain;base64,aGVsbG8=')).toBe('text/plain');
    });

    test('handles malformed data URI', () => {
      expect(detectMimeTypeFromDataUri('data:invalid')).toBe('image/png');
      expect(detectMimeTypeFromDataUri('data:')).toBe('image/png');
    });
  });

  describe('validateImageMimeType', () => {
    test('normalizes image/jpg to image/jpeg', () => {
      expect(validateImageMimeType('image/jpg')).toBe('image/jpeg');
    });

    test('keeps valid MIME types unchanged', () => {
      expect(validateImageMimeType('image/png')).toBe('image/png');
      expect(validateImageMimeType('image/jpeg')).toBe('image/jpeg');
      expect(validateImageMimeType('image/webp')).toBe('image/webp');
      expect(validateImageMimeType('image/gif')).toBe('image/gif');
      expect(validateImageMimeType('image/bmp')).toBe('image/bmp');
      expect(validateImageMimeType('image/svg+xml')).toBe('image/svg+xml');
      expect(validateImageMimeType('image/tiff')).toBe('image/tiff');
    });

    test('defaults to PNG for invalid MIME types', () => {
      expect(validateImageMimeType('invalid/type')).toBe('image/png');
      expect(validateImageMimeType('text/plain')).toBe('image/png');
      expect(validateImageMimeType('application/json')).toBe('image/png');
      expect(validateImageMimeType('')).toBe('image/png');
    });
  });

  describe('extractFilenameFromUri', () => {
    test('preserves original filename from file URI', () => {
      expect(extractFilenameFromUri('file:///path/MyPhoto.PNG', 'image/png')).toBe('MyPhoto.PNG');
      expect(extractFilenameFromUri('file:///photos/vacation.jpg', 'image/jpeg')).toBe('vacation.jpg');
      expect(extractFilenameFromUri('file:///downloads/Screenshot.WebP', 'image/webp')).toBe('Screenshot.WebP');
    });

    test('preserves filename with mixed case', () => {
      expect(extractFilenameFromUri('file:///path/Screenshot.Jpeg', 'image/jpeg')).toBe('Screenshot.Jpeg');
      expect(extractFilenameFromUri('file:///images/Icon.Svg', 'image/svg+xml')).toBe('Icon.Svg');
    });

    test('generates filename for data URI', () => {
      const filename = extractFilenameFromUri('data:image/png;base64,...', 'image/png');
      expect(filename).toMatch(/^image_\d+\.png$/);
    });

    test('generates filename for file URI without extension', () => {
      const filename = extractFilenameFromUri('file:///path/imagefile', 'image/jpeg');
      expect(filename).toMatch(/^image_\d+\.jpg$/);
    });

    test('generates filename for file URI with directory name only', () => {
      const filename = extractFilenameFromUri('file:///path/', 'image/png');
      expect(filename).toMatch(/^image_\d+\.png$/);
    });

    test('generates correct extensions based on MIME type', () => {
      expect(extractFilenameFromUri('data:...', 'image/jpeg')).toMatch(/\.jpg$/);
      expect(extractFilenameFromUri('data:...', 'image/png')).toMatch(/\.png$/);
      expect(extractFilenameFromUri('data:...', 'image/webp')).toMatch(/\.webp$/);
      expect(extractFilenameFromUri('data:...', 'image/gif')).toMatch(/\.gif$/);
      expect(extractFilenameFromUri('data:...', 'image/bmp')).toMatch(/\.bmp$/);
      expect(extractFilenameFromUri('data:...', 'image/svg+xml')).toMatch(/\.svg$/);
      expect(extractFilenameFromUri('data:...', 'image/tiff')).toMatch(/\.tiff$/);
    });
  });

  describe('processImageUri', () => {
    describe('file:// URIs', () => {
      test('processes JPEG file URI correctly', async () => {
        const mockBlob = new Blob(['fake jpeg data'], { type: 'image/jpeg' });
        (fetch as jest.Mock).mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await processImageUri('file:///path/to/image.jpg');

        expect(fetch).toHaveBeenCalledWith('file:///path/to/image.jpg');
        expect(result).toEqual({
          mime: 'image/jpeg',
          base64Data: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          filename: 'image.jpg',
        });
      });

      test('processes PNG file URI correctly', async () => {
        const mockBlob = new Blob(['fake png data'], { type: 'image/png' });
        (fetch as jest.Mock).mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await processImageUri('file:///photos/screenshot.png');

        expect(result).toEqual({
          mime: 'image/png',
          base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==',
          filename: 'screenshot.png',
        });
      });

      test('falls back to file extension when blob type is empty', async () => {
        const mockBlob = new Blob(['fake data'], { type: '' }); // Empty blob type
        (fetch as jest.Mock).mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await processImageUri('file:///path/to/image.webp');

        expect(result.mime).toBe('image/webp'); // Should detect from extension
        expect(result.filename).toBe('image.webp');
      });

      test('generates filename when file URI has no extension', async () => {
        const mockBlob = new Blob(['fake data'], { type: 'image/jpeg' });
        (fetch as jest.Mock).mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await processImageUri('file:///path/to/imagefile');

        expect(result.mime).toBe('image/jpeg');
        expect(result.filename).toMatch(/^image_\d+\.jpg$/); // Generated filename
      });

      test('prioritizes blob type over file extension', async () => {
        // File extension says .png but blob type says jpeg
        const mockBlob = new Blob(['fake jpeg data'], { type: 'image/jpeg' });
        (fetch as jest.Mock).mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        });

        const result = await processImageUri('file:///path/to/image.png');

        expect(result.mime).toBe('image/jpeg'); // Should use blob type, not extension
        expect(result.filename).toBe('image.png'); // But preserve original filename
      });

      test('handles file fetch error gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

        await expect(processImageUri('file:///path/to/nonexistent.jpg'))
          .rejects.toThrow('Failed to process image: File not found');
      });

      test('handles network timeout error', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

        await expect(processImageUri('file:///path/to/slow.jpg'))
          .rejects.toThrow('Failed to process image: Network timeout');
      });
    });

    describe('data: URIs', () => {
      test('processes valid PNG data URI correctly', async () => {
        const pngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
        
        const result = await processImageUri(pngDataUri);

        expect(result).toEqual({
          mime: 'image/png',
          base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==',
          filename: expect.stringMatching(/^image_\d+\.png$/),
        });
      });

      test('processes valid JPEG data URI correctly', async () => {
        const jpegDataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        const result = await processImageUri(jpegDataUri);

        expect(result).toEqual({
          mime: 'image/jpeg',
          base64Data: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          filename: expect.stringMatching(/^image_\d+\.jpg$/),
        });
      });

      test('processes WebP data URI correctly', async () => {
        const webpDataUri = 'data:image/webp;base64,UklGRhoBAABXRUJQVlA4IA4AAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
        
        const result = await processImageUri(webpDataUri);

        expect(result).toEqual({
          mime: 'image/webp',
          base64Data: 'UklGRhoBAABXRUJQVlA4IA4AAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
          filename: expect.stringMatching(/^image_\d+\.webp$/),
        });
      });

      test('normalizes image/jpg to image/jpeg in data URI', async () => {
        const jpgDataUri = 'data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        
        const result = await processImageUri(jpgDataUri);

        expect(result.mime).toBe('image/jpeg'); // Should be normalized
        expect(result.base64Data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
        expect(result.filename).toMatch(/^image_\d+\.jpg$/);
      });

      test('handles malformed data URI - missing base64 part', async () => {
        const malformedDataUri = 'data:image/png;base64,'; // No base64 data

        await expect(processImageUri(malformedDataUri))
          .rejects.toThrow('Malformed data URI - missing base64 data');
      });

      test('handles malformed data URI - invalid format', async () => {
        const malformedDataUri = 'data:invalid-format'; // No base64 part at all

        await expect(processImageUri(malformedDataUri))
          .rejects.toThrow('Malformed data URI - missing base64 data');
      });

      test('handles data URI with non-image MIME type', async () => {
        // Should still process it but default to image/png for validation
        const textDataUri = 'data:text/plain;base64,aGVsbG8gd29ybGQ=';
        
        const result = await processImageUri(textDataUri);

        expect(result.mime).toBe('image/png'); // Validated and defaulted to image/png
        expect(result.base64Data).toBe('aGVsbG8gd29ybGQ=');
        expect(result.filename).toMatch(/^image_\d+\.png$/);
      });
    });

    describe('unsupported URIs', () => {
      test('throws error for http URI', async () => {
        await expect(processImageUri('http://example.com/image.jpg'))
          .rejects.toThrow('Unsupported image URI format');
      });

      test('throws error for https URI', async () => {
        await expect(processImageUri('https://example.com/image.png'))
          .rejects.toThrow('Unsupported image URI format');
      });

      test('throws error for ftp URI', async () => {
        await expect(processImageUri('ftp://server.com/image.gif'))
          .rejects.toThrow('Unsupported image URI format');
      });

      test('throws error for relative path', async () => {
        await expect(processImageUri('./image.jpg'))
          .rejects.toThrow('Unsupported image URI format');
      });

      test('throws error for absolute path without scheme', async () => {
        await expect(processImageUri('/path/to/image.png'))
          .rejects.toThrow('Unsupported image URI format');
      });

      test('throws error for empty string', async () => {
        await expect(processImageUri(''))
          .rejects.toThrow('Unsupported image URI format');
      });
    });
  });

  describe('processImageUris', () => {
    test('processes multiple file URIs', async () => {
      const mockJpegBlob = new Blob(['fake jpeg'], { type: 'image/jpeg' });
      const mockPngBlob = new Blob(['fake png'], { type: 'image/png' });
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ blob: () => Promise.resolve(mockJpegBlob) })
        .mockResolvedValueOnce({ blob: () => Promise.resolve(mockPngBlob) });

      const uris = [
        'file:///path/photo.jpg',
        'file:///screenshots/screen.png'
      ];

      const results = await processImageUris(uris);

      expect(results).toHaveLength(2);
      expect(results[0].mime).toBe('image/jpeg');
      expect(results[0].filename).toBe('photo.jpg');
      expect(results[0].base64Data).toMatch(/^\/9j\/.*/);
      expect(results[1].mime).toBe('image/png');
      expect(results[1].filename).toBe('screen.png');
      expect(results[1].base64Data).toMatch(/^iVBORw0KGgo.*/);
    });

    test('processes multiple data URIs', async () => {
      const uris = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      ];

      const results = await processImageUris(uris);

      expect(results).toHaveLength(2);
      expect(results[0].mime).toBe('image/png');
      expect(results[1].mime).toBe('image/jpeg');
      expect(results[0].base64Data).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==');
      expect(results[1].base64Data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QFLQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
    });

    test('processes mixed file and data URIs', async () => {
      const mockBlob = new Blob(['fake data'], { type: 'image/webp' });
      (fetch as jest.Mock).mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      });

      const uris = [
        'file:///path/image.webp',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg=='
      ];

      const results = await processImageUris(uris);

      expect(results).toHaveLength(2);
      expect(results[0].mime).toBe('image/webp');
      expect(results[1].mime).toBe('image/png');
      expect(fetch).toHaveBeenCalledWith('file:///path/image.webp');
    });

    test('throws error if any URI fails to process', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      const uris = [
        'file:///path/nonexistent.jpg',
        'data:image/png;base64,validdata'
      ];

      await expect(processImageUris(uris))
        .rejects.toThrow('Failed to process image: File not found');
    });

    test('processes empty array', async () => {
      const results = await processImageUris([]);
      expect(results).toEqual([]);
    });

    test('processes single URI in array', async () => {
      const mockBlob = new Blob(['fake data'], { type: 'image/png' });
      (fetch as jest.Mock).mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      });

      const results = await processImageUris(['file:///path/single.png']);

      expect(results).toHaveLength(1);
      expect(results[0].mime).toBe('image/png');
      expect(results[0].filename).toBe('single.png');
    });
  });

  describe('blobToBase64', () => {
    test('converts blob to base64 string (without data URI prefix)', async () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      
      const base64 = await blobToBase64(mockBlob);

      // Should return just the base64 part, not the full data URI
      expect(base64).toMatch(/^\/9j\/.*/); // JPEG signature
      expect(base64).not.toContain('data:');
      expect(base64).not.toContain(';base64,');
    });

    test('handles PNG blob', async () => {
      const mockBlob = new Blob(['png data'], { type: 'image/png' });
      
      const base64 = await blobToBase64(mockBlob);

      expect(base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==');
    });
  });
});