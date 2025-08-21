/**
 * Integration tests to verify the image processing fixes the duplicate MIME type issue
 * that was reported in the ConnectionContext
 */
import { processImageUri } from '../../src/utils/imageProcessing';

// Mock global fetch for file URI processing
global.fetch = jest.fn();

// Mock FileReader for blob to base64 conversion
global.FileReader = class MockFileReader {
  result: string | null = null;
  onload: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  readAsDataURL(blob: Blob) {
    setTimeout(() => {
      if (blob.type === 'image/png') {
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      } else {
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      }
      if (this.onload) {
        this.onload({});
      }
    }, 0);
  }
} as any;

describe('Image Processing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  describe('Fixes for duplicate MIME type issue', () => {
    test('file:// URI processing returns only base64 data (no duplicate prefixes)', async () => {
      const mockBlob = new Blob(['fake png data'], { type: 'image/png' });
      (fetch as jest.Mock).mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      });

      const result = await processImageUri('file:///path/to/image.png');

      // The url should contain ONLY the base64 data, not the full data URI
      expect(result.base64Data).not.toContain('data:');
      expect(result.base64Data).not.toContain('image/png');
      expect(result.base64Data).not.toContain('base64,');
      
      // Should be just the base64 string
      expect(result.base64Data).toMatch(/^iVBORw0KGgo.*/);
      
      // MIME type should be separate
      expect(result.mime).toBe('image/png');
      expect(result.filename).toBe('image.png');
    });

    test('data: URI processing returns only base64 data (no duplicate prefixes)', async () => {
      const inputDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      
      const result = await processImageUri(inputDataUri);

      // The base64Data should contain ONLY the base64 part, not the prefix
      expect(result.base64Data).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==');
      expect(result.base64Data).not.toContain('data:');
      expect(result.base64Data).not.toContain('image/png');
      expect(result.base64Data).not.toContain('base64,');
      
      // MIME type should be separate
      expect(result.mime).toBe('image/png');
    });

    test('demonstrates the fix: no more duplicate MIME type prefixes', async () => {
      const inputDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      
      const result = await processImageUri(inputDataUri);

      // Simulate what would happen in ConnectionContext - building API request parts
      const apiPart = {
        type: 'file',
        mime: result.mime,
        url: result.base64Data, // This is what gets sent to the API
        filename: result.filename
      };

      // The API part should have clean structure with no duplicate prefixes
      expect(apiPart).toEqual({
        type: 'file',
        mime: 'image/png',
        url: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==', // Just base64
        filename: expect.stringMatching(/^image_\d+\.png$/),
      });

      // Verify there are no duplicate MIME type prefixes in the URL
      expect(apiPart.url).not.toMatch(/data:.*data:/); // No duplicate "data:"
      expect(apiPart.url).not.toMatch(/image\/png.*image\/png/); // No duplicate MIME types
      expect(apiPart.url).not.toMatch(/base64,.*base64,/); // No duplicate "base64,"
    });

    test('handles image/jpg normalization without duplicate prefixes', async () => {
      const inputDataUri = 'data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/fake-jpeg-data';
      
      const result = await processImageUri(inputDataUri);

      // Should normalize to image/jpeg but not create duplicate prefixes
      expect(result.mime).toBe('image/jpeg');
      expect(result.base64Data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/fake-jpeg-data');
      expect(result.base64Data).not.toContain('data:');
      expect(result.base64Data).not.toContain('image/jpg');
      expect(result.base64Data).not.toContain('image/jpeg');
      expect(result.base64Data).not.toContain('base64,');
    });

    test('verifies the original bug scenario is fixed', async () => {
      // This test represents the original problem scenario:
      // User reported getting: "data:image/png;base64,data:image/png;base64,iVBORw0KGgoAAAA..."
      
      const inputDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAG8ui+1AAAAABJRU5ErkJggg==';
      
      const result = await processImageUri(inputDataUri);
      
      // With our fix, the API request part should have:
      // - mime: "image/png" 
      // - url: "iVBORw0KGgoAAAA..." (just the base64 data)
      // 
      // NOT: url: "data:image/png;base64,data:image/png;base64,iVBORw0KGgoAAAA..."

      const simulatedApiUrl = result.base64Data; // What gets sent to the API
      
      // Verify we don't have the duplicate prefix issue
      expect(simulatedApiUrl).not.toMatch(/^data:image\/png;base64,data:image\/png;base64,/);
      expect(simulatedApiUrl).not.toContain('data:image/png;base64,data:image/png;base64,');
      
      // Should be clean base64 data only
      expect(simulatedApiUrl).toMatch(/^iVBORw0KGgo/);
      expect(simulatedApiUrl).not.toContain('data:');
    });
  });
});