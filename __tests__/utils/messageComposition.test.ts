import {
  extractFileMentionsFromText,
  createFilePartsFromMentionsInMessage,
  processMessageForSending,
  hasFileMentions,
  countFileMentions,
  getFilePathsFromText,
  type MessageProcessingOptions
} from '../../src/utils/messageUtils';
import { createFilePartFromMention, detectFileMentions, createFilePartsFromMentions } from '../../src/utils/fileMentions';
import type { Client } from '../../src/api/client/types.gen';
import type { FilePartInput } from '../../src/api/types.gen';

// Mock the fileMentions utilities
jest.mock('../../src/utils/fileMentions');
const mockCreateFilePartFromMention = createFilePartFromMention as jest.MockedFunction<typeof createFilePartFromMention>;
const mockDetectFileMentions = detectFileMentions as jest.MockedFunction<typeof detectFileMentions>;
const mockCreateFilePartsFromMentions = createFilePartsFromMentions as jest.MockedFunction<typeof createFilePartsFromMentions>;

describe('messageUtils - Message Composition', () => {
  // Mock client for testing
  const mockClient = {} as Client;

  beforeEach(() => {
    jest.clearAllMocks();
    
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
    mockCreateFilePartsFromMentions.mockImplementation(async (mentions, client) => {
      const results = await Promise.allSettled(
        mentions.map(mention => mockCreateFilePartFromMention(mention, client))
      );
      
      return results
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter((filePart): filePart is FilePartInput => filePart !== null);
    });
  });

  describe('extractFileMentionsFromText', () => {
    it('should extract single file mention', () => {
      const text = 'Check out @src/utils/helper.ts for details';
      const mentions = extractFileMentionsFromText(text);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0].path).toBe('src/utils/helper.ts');
      expect(mentions[0].query).toBe('src/utils/helper.ts');
    });

    it('should extract multiple file mentions', () => {
      const text = 'Files @app.tsx and @components/Button.tsx need updates';
      const mentions = extractFileMentionsFromText(text);
      
      expect(mentions).toHaveLength(2);
      expect(mentions[0].path).toBe('app.tsx');
      expect(mentions[1].path).toBe('components/Button.tsx');
    });

    it('should remove duplicate file mentions', () => {
      const text = 'Check @file.ts and also @file.ts again';
      const mentions = extractFileMentionsFromText(text);
      
      expect(mentions).toHaveLength(1);
      expect(mentions[0].path).toBe('file.ts');
    });

    it('should handle empty or invalid input', () => {
      expect(extractFileMentionsFromText('')).toEqual([]);
      expect(extractFileMentionsFromText(null as any)).toEqual([]);
      expect(extractFileMentionsFromText(undefined as any)).toEqual([]);
    });

    it('should handle text with no mentions', () => {
      const text = 'This is just regular text without any mentions';
      const mentions = extractFileMentionsFromText(text);
      
      expect(mentions).toEqual([]);
    });
  });

  describe('createFilePartsFromMentionsInMessage', () => {
    it('should create FileParts from mentions', async () => {
      const mentions = [
        { path: 'file1.ts', start: 0, end: 10, query: 'file1.ts' },
        { path: 'file2.ts', start: 15, end: 25, query: 'file2.ts' }
      ];

      const mockFilePart1: FilePartInput = {
        type: 'file',
        mime: 'text/typescript',
        filename: 'file1.ts',
        url: 'file1.ts'
      };

      const mockFilePart2: FilePartInput = {
        type: 'file',
        mime: 'text/typescript', 
        filename: 'file2.ts',
        url: 'file2.ts'
      };

      mockCreateFilePartFromMention
        .mockResolvedValueOnce(mockFilePart1)
        .mockResolvedValueOnce(mockFilePart2);

      const result = await createFilePartsFromMentionsInMessage(mentions, mockClient);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockFilePart1);
      expect(result[1]).toEqual(mockFilePart2);
    });

    it('should handle empty mentions array', async () => {
      const result = await createFilePartsFromMentionsInMessage([], mockClient);
      expect(result).toEqual([]);
    });

    it('should limit number of file parts', async () => {
      const mentions = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i}.ts`,
        start: i * 10,
        end: (i * 10) + 8,
        query: `file${i}.ts`
      }));

      mockCreateFilePartFromMention.mockResolvedValue({
        type: 'file',
        mime: 'text/typescript',
        filename: 'test.ts',
        url: 'test.ts'
      } as FilePartInput);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await createFilePartsFromMentionsInMessage(mentions, mockClient, { 
        maxFileParts: 10 
      });

      expect(result).toHaveLength(10);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message processing limited to 10 file parts')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processMessageForSending', () => {
    it('should process message with no file mentions', async () => {
      const text = 'Hello world, no file mentions here';
      const result = await processMessageForSending(text, mockClient);

      expect(result.textPart.text).toBe(text);
      expect(result.fileParts).toEqual([]);
      expect(result.invalidMentions).toEqual([]);
    });

    it('should process message with valid file mentions', async () => {
      const text = 'Check @file.ts for implementation';
      
      const mockFilePart: FilePartInput = {
        type: 'file',
        mime: 'text/typescript',
        filename: 'file.ts', 
        url: 'file.ts'
      };

      mockCreateFilePartFromMention.mockResolvedValue(mockFilePart);

      const result = await processMessageForSending(text, mockClient);

      expect(result.textPart.text).toBe(text); // Should keep mention text by default
      expect(result.fileParts).toHaveLength(1);
      expect(result.fileParts[0]).toEqual(mockFilePart);
      expect(result.invalidMentions).toEqual([]);
    });

    it('should remove mention text when keepMentionText is false', async () => {
      const text = 'Check @file.ts for implementation';
      
      const mockFilePart: FilePartInput = {
        type: 'file',
        mime: 'text/typescript',
        filename: 'file.ts',
        url: 'file.ts'
      };

      mockCreateFilePartFromMention.mockResolvedValue(mockFilePart);

      const options: MessageProcessingOptions = {
        keepMentionText: false
      };

      const result = await processMessageForSending(text, mockClient, options);

      expect(result.textPart.text).toBe('Check for implementation');
      expect(result.fileParts).toHaveLength(1);
    });

    it('should handle failed file part creation', async () => {
      const text = 'Check @invalid-file.ts for details';
      
      mockCreateFilePartFromMention.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await processMessageForSending(text, mockClient);

      expect(result.textPart.text).toBe(text);
      expect(result.fileParts).toEqual([]);
      expect(result.invalidMentions).toHaveLength(1);
      expect(result.invalidMentions[0].path).toBe('invalid-file.ts');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle text validation failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Test empty text
      const result1 = await processMessageForSending('', mockClient);
      expect(result1.textPart.text).toBe('');
      
      // Test very long text
      const longText = 'a'.repeat(100000);
      const result2 = await processMessageForSending(longText, mockClient);
      expect(result2.textPart.text.length).toBeLessThanOrEqual(50 * 1024);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should preserve original text if removing mentions would make it empty', async () => {
      const text = '@file.ts';
      
      const mockFilePart: FilePartInput = {
        type: 'file',
        mime: 'text/typescript',
        filename: 'file.ts',
        url: 'file.ts'
      };

      mockCreateFilePartFromMention.mockResolvedValue(mockFilePart);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const options: MessageProcessingOptions = {
        keepMentionText: false
      };

      const result = await processMessageForSending(text, mockClient, options);

      expect(result.textPart.text).toBe(text); // Should keep original text
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('would leave empty text')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('utility functions', () => {
    describe('hasFileMentions', () => {
      it('should return true when text has file mentions', () => {
        expect(hasFileMentions('Check @file.ts')).toBe(true);
        expect(hasFileMentions('Multiple @file1.ts and @file2.ts')).toBe(true);
      });

      it('should return false when text has no file mentions', () => {
        expect(hasFileMentions('No mentions here')).toBe(false);
        expect(hasFileMentions('')).toBe(false);
      });
    });

    describe('countFileMentions', () => {
      it('should count file mentions correctly', () => {
        expect(countFileMentions('Check @file.ts')).toBe(1);
        expect(countFileMentions('@file1.ts and @file2.ts')).toBe(2);
        expect(countFileMentions('@file.ts and @file.ts again')).toBe(1); // Duplicates
        expect(countFileMentions('No mentions')).toBe(0);
      });
    });

    describe('getFilePathsFromText', () => {
      it('should extract file paths from text', () => {
        const paths = getFilePathsFromText('Check @src/file.ts and @components/Button.tsx');
        expect(paths).toEqual(['src/file.ts', 'components/Button.tsx']);
      });

      it('should handle duplicate paths', () => {
        const paths = getFilePathsFromText('@file.ts and @file.ts again');
        expect(paths).toEqual(['file.ts']);
      });

      it('should return empty array for no mentions', () => {
        const paths = getFilePathsFromText('No mentions here');
        expect(paths).toEqual([]);
      });
    });
  });
});