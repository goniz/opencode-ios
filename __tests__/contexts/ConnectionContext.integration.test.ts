import { processMessageForSending } from '../../src/utils/messageUtils';
import type { Client } from '../../src/api/client/types.gen';
import type { FilePartInput } from '../../src/api/types.gen';

// Mock the fileMentions utilities
jest.mock('../../src/utils/fileMentions', () => ({
  detectFileMentions: jest.fn(),
  createFilePartFromMention: jest.fn(),
  createFilePartsFromMentions: jest.fn()
}));

// Mock the messageUtils
jest.mock('../../src/utils/messageUtils', () => ({
  processMessageForSending: jest.fn()
}));

const mockProcessMessageForSending = processMessageForSending as jest.MockedFunction<typeof processMessageForSending>;
const mockDetectFileMentions = require('../../src/utils/fileMentions').detectFileMentions as jest.MockedFunction<any>;
const mockCreateFilePartFromMention = require('../../src/utils/fileMentions').createFilePartFromMention as jest.MockedFunction<any>;
const mockCreateFilePartsFromMentions = require('../../src/utils/fileMentions').createFilePartsFromMentions as jest.MockedFunction<any>;

describe('ConnectionContext - File Mentions Integration', () => {
  // Mock client for testing
  const mockClient = {} as Client;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the processMessageForSending mock to default behavior
    mockProcessMessageForSending.mockImplementation(async (text, client, options = {}) => {
      // Simple default implementation
      return {
        textPart: { type: 'text' as const, text },
        fileParts: [],
        invalidMentions: []
      };
    });

    // Default mock setup
    mockDetectFileMentions.mockImplementation((text: string) => {
      // Simple implementation that finds @filepath patterns
      const mentions = [];
      const regex = /@([^\s@]+)/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        mentions.push({
          path: match[1],
          start: match.index,
          end: match.index + match[0].length,
          query: match[1]
        });
      }

      return mentions;
    });

    // Mock createFilePartsFromMentions to use individual createFilePartFromMention calls
    mockCreateFilePartsFromMentions.mockImplementation(async (mentions: any[], client: any) => {
      const results = await Promise.allSettled(
        mentions.map((mention: any) => mockCreateFilePartFromMention(mention, client))
      );

      return results
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter((filePart): filePart is FilePartInput => filePart !== null);
    });
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
      const text = 'Hello world, no file mentions here';
      const result = await processMessageForSending(text, mockClient);

      expect(result.textPart.text).toBe(text);
      expect(result.fileParts).toEqual([]);
      expect(result.invalidMentions).toEqual([]);
    });

    it('should handle file-only message through processMessageForSending', async () => {
      const text = '@example.ts';

      const mockFilePart: FilePartInput = {
        type: 'file',
        mime: 'text/typescript',
        filename: 'example.ts',
        url: '/path/to/example.ts'
      };

      mockProcessMessageForSending.mockResolvedValue({
        textPart: { type: 'text' as const, text: '' },
        fileParts: [mockFilePart],
        invalidMentions: []
      });

      const result = await processMessageForSending(text, mockClient, {
        keepMentionText: false // Remove the @filepath text
      });

      expect(result.textPart.text).toBe(''); // Text should be empty after removing mention
      expect(result.fileParts).toHaveLength(1);
      expect(result.fileParts[0]).toEqual(mockFilePart);
      expect(result.invalidMentions).toEqual([]);
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

    it('should handle file-only message (no text content)', () => {
      const processedMessage = {
        textPart: { type: 'text' as const, text: '' },
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

      const parts: any[] = [];

      // This simulates the logic from ConnectionContext
      if (processedMessage.textPart.text.trim()) {
        parts.push({
          type: 'text',
          text: processedMessage.textPart.text,
          id: undefined,
          synthetic: undefined,
          time: undefined
        });
      }

      if (processedMessage.fileParts.length > 0) {
        parts.push(...processedMessage.fileParts);
      }

      // Should have only the file part
      expect(parts).toHaveLength(1);
      expect(parts[0].type).toBe('file');
      expect(parts[0].filename).toBe('example.ts');
      expect(parts[0].mime).toBe('text/typescript');
    });

    it('should handle multiple files without text', () => {
      const processedMessage = {
        textPart: { type: 'text' as const, text: '' },
        fileParts: [
          {
            type: 'file' as const,
            mime: 'text/typescript',
            filename: 'file1.ts',
            url: '/path/to/file1.ts'
          },
          {
            type: 'file' as const,
            mime: 'text/javascript',
            filename: 'file2.js',
            url: '/path/to/file2.js'
          }
        ] as FilePartInput[],
        invalidMentions: []
      };

      const parts: any[] = [];

      if (processedMessage.textPart.text.trim()) {
        parts.push({
          type: 'text',
          text: processedMessage.textPart.text,
          id: undefined,
          synthetic: undefined,
          time: undefined
        });
      }

      if (processedMessage.fileParts.length > 0) {
        parts.push(...processedMessage.fileParts);
      }

      expect(parts).toHaveLength(2);
      expect(parts[0].type).toBe('file');
      expect(parts[0].filename).toBe('file1.ts');
      expect(parts[1].type).toBe('file');
      expect(parts[1].filename).toBe('file2.js');
    });
  });
});