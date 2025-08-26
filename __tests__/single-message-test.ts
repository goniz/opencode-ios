import { processMessageForSending } from '../src/utils/messageUtils';

// Mock client for testing
const mockClient = {
  // Mock client implementation
} as any;

describe('Single Message Processing', () => {
  it('should process a single message without file mentions', async () => {
    const message = 'Hello world, this is a simple message without any file mentions';

    const result = await processMessageForSending(message, mockClient);

    expect(result.textPart.text).toBe(message);
    expect(result.fileParts).toEqual([]);
    expect(result.invalidMentions).toEqual([]);

    console.log('✅ Single message processed successfully:', {
      text: result.textPart.text,
      filePartsCount: result.fileParts.length,
      invalidMentionsCount: result.invalidMentions.length
    });
  });

  it('should handle empty message', async () => {
    const message = '';

    const result = await processMessageForSending(message, mockClient);

    expect(result.textPart.text).toBe('');
    expect(result.fileParts).toEqual([]);
    expect(result.invalidMentions).toEqual([]);
  });

  it('should handle message with special characters but no file mentions', async () => {
    const message = 'Check the documentation for @ symbol usage, but no actual file mentions!';

    const result = await processMessageForSending(message, mockClient);

    expect(result.textPart.text).toBe(message);
    expect(result.fileParts).toEqual([]);
    expect(result.invalidMentions).toEqual([]);
  });
});