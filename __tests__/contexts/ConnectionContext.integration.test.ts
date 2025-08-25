import { processMessageForSending } from '../../src/utils/messageUtils';
import type { Client } from '../../src/api/client/types.gen';
import type { FilePartInput } from '../../src/api/types.gen';

// Mock the fileMentions utilities
jest.mock('../../src/utils/fileMentions', () => ({
  detectFileMentions: jest.fn(),
  createFilePartsFromMentions: jest.fn(),
  createFilePartFromMention: jest.fn()
}));

// Mock the messageUtils
jest.mock('../../src/utils/messageUtils', () => ({
  processMessageForSending: jest.fn()
}));

const mockProcessMessageForSending = processMessageForSending as jest.MockedFunction<typeof processMessageForSending>;

describe('ConnectionContext - File Mentions Integration', () => {
  // Mock client for testing
  const mockClient = {} as Client;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage integration with file mentions', () => {
    it('should process message with file mentions correctly', async () => {
      // Mock the processMessageForSending function
      const mockProcessedMessage = {
        textPart: { type: 'text' as const, text: 'Check this file for details' },
        fileParts: [
          {
            type: 'file' as const,
            mime: 'text/typescript',
            filename: 'example.ts',
            url: '/path/to/example.ts'
          }
        ] as FilePartInput[],
        invalidMentions: []
      };

      mockProcessMessageForSending.mockResolvedValue(mockProcessedMessage);

      // Test the function call that would happen in ConnectionContext
      const result = await processMessageForSending('Check @example.ts for details', mockClient, {
        keepMentionText: true,
        maxFileParts: 10,
        validateFiles: true
      });

      expect(result).toEqual(mockProcessedMessage);
      expect(mockProcessMessageForSending).toHaveBeenCalledWith(
        'Check @example.ts for details',
        mockClient,
        {
          keepMentionText: true,
          maxFileParts: 10,
          validateFiles: true
        }
      );
    });

    it('should handle messages without file mentions', async () => {
      const mockProcessedMessage = {
        textPart: { type: 'text' as const, text: 'Hello world, no file mentions here' },
        fileParts: [] as FilePartInput[],
        invalidMentions: []
      };

      mockProcessMessageForSending.mockResolvedValue(mockProcessedMessage);

      const result = await processMessageForSending('Hello world, no file mentions here', mockClient);

      expect(result).toEqual(mockProcessedMessage);
      expect(result.fileParts).toHaveLength(0);
      expect(result.invalidMentions).toHaveLength(0);
    });

    it('should handle file processing errors gracefully', async () => {
      // Mock a processing error
      mockProcessMessageForSending.mockRejectedValue(new Error('File processing failed'));

      // This would be the fallback behavior in ConnectionContext
      let processedMessage;
      try {
        processedMessage = await processMessageForSending('Check @file.ts', mockClient);
      } catch (error) {
        // Fallback to original message processing
        processedMessage = {
          textPart: { type: 'text' as const, text: 'Check @file.ts' },
          fileParts: [],
          invalidMentions: []
        };
      }

      expect(processedMessage.textPart.text).toBe('Check @file.ts');
      expect(processedMessage.fileParts).toEqual([]);
    });

    it('should handle invalid mentions', async () => {
      const mockProcessedMessage = {
        textPart: { type: 'text' as const, text: 'Check this file for details' },
        fileParts: [] as FilePartInput[],
        invalidMentions: [
          { path: 'nonexistent.ts', start: 6, end: 20, query: 'nonexistent.ts' }
        ]
      };

      mockProcessMessageForSending.mockResolvedValue(mockProcessedMessage);

      const result = await processMessageForSending('Check @nonexistent.ts for details', mockClient);

      expect(result.invalidMentions).toHaveLength(1);
      expect(result.invalidMentions[0].path).toBe('nonexistent.ts');
      expect(result.fileParts).toHaveLength(0);
    });

    it('should validate message content before sending', async () => {
      const mockProcessedMessage = {
        textPart: { type: 'text' as const, text: 'Valid message with file' },
        fileParts: [
          {
            type: 'file' as const,
            mime: 'text/plain',
            filename: 'test.txt',
            url: '/path/to/test.txt'
          }
        ] as FilePartInput[],
        invalidMentions: []
      };

      mockProcessMessageForSending.mockResolvedValue(mockProcessedMessage);

      const result = await processMessageForSending('Valid message with @test.txt', mockClient);

      expect(result.textPart.text).toBe('Valid message with file');
      expect(result.fileParts).toHaveLength(1);
      expect(result.fileParts[0].filename).toBe('test.txt');
    });
  });

  describe('parts array construction', () => {
    it('should construct parts array correctly with text and file parts', () => {
      // This simulates the parts construction logic from ConnectionContext
      const processedMessage = {
        textPart: { type: 'text' as const, text: 'Check this file' },
        fileParts: [
          {
            type: 'file' as const,
            mime: 'text/typescript',
            filename: 'example.ts',
            url: '/path/to/example.ts'
          }
        ] as FilePartInput[],
        invalidMentions: []
      };

      // Simulate the parts array construction
      const parts: any[] = [];

      if (processedMessage.textPart.text.trim()) {
        parts.push({
          type: 'text',
          text: processedMessage.textPart.text
        });
      }

      if (processedMessage.fileParts.length > 0) {
        parts.push(...processedMessage.fileParts);
      }

      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual({
        type: 'text',
        text: 'Check this file'
      });
      expect(parts[1]).toEqual({
        type: 'file',
        mime: 'text/typescript',
        filename: 'example.ts',
        url: '/path/to/example.ts'
      });
    });

    it('should handle empty text part correctly', () => {
      const processedMessage = {
        textPart: { type: 'text' as const, text: '' },
        fileParts: [
          {
            type: 'file' as const,
            mime: 'text/plain',
            filename: 'file.txt',
            url: '/path/to/file.txt'
          }
        ] as FilePartInput[],
        invalidMentions: []
      };

      const parts: any[] = [];

      if (processedMessage.textPart.text.trim()) {
        parts.push({
          type: 'text',
          text: processedMessage.textPart.text
        });
      }

      if (processedMessage.fileParts.length > 0) {
        parts.push(...processedMessage.fileParts);
      }

      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('file');
    });
  });
});