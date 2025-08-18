import { filterMessageParts, isPartVisible, categorizeMessageParts } from '../../src/utils/messageFiltering';
import type { Part } from '../../src/api/types.gen';

describe('messageFiltering', () => {
  const createTextPart = (id: string, text: string, synthetic?: boolean): Part => ({
    id,
    sessionID: 'test-session',
    messageID: 'test-message',
    type: 'text',
    text,
    synthetic,
  });

  const createToolPart = (id: string, tool: string, status: 'pending' | 'running' | 'completed' | 'error'): Part => ({
    id,
    sessionID: 'test-session',
    messageID: 'test-message',
    type: 'tool',
    callID: 'call-1',
    tool,
    state: {
      status,
      ...(status === 'completed' ? {
        input: {},
        output: 'test output',
        title: 'Test Tool',
        metadata: {},
        time: { start: Date.now(), end: Date.now() }
      } : status === 'error' ? {
        input: {},
        error: 'test error',
        time: { start: Date.now(), end: Date.now() }
      } : status === 'running' ? {
        time: { start: Date.now() }
      } : {})
    } as any,
  });

  const createStepStartPart = (id: string): Part => ({
    id,
    sessionID: 'test-session',
    messageID: 'test-message',
    type: 'step-start',
  });

  const createStepFinishPart = (id: string): Part => ({
    id,
    sessionID: 'test-session',
    messageID: 'test-message',
    type: 'step-finish',
    cost: 0.01,
    tokens: {
      input: 10,
      output: 20,
      reasoning: 0,
      cache: { read: 0, write: 0 }
    },
  });

  describe('filterMessageParts', () => {
    it('should filter out empty text parts', () => {
      const parts = [
        createTextPart('1', 'Hello world'),
        createTextPart('2', ''),
        createTextPart('3', '   '),
        createTextPart('4', 'Another message'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect((filtered[0] as any).text).toBe('Hello world');
      expect((filtered[1] as any).text).toBe('Another message');
    });

    it('should filter out synthetic text parts', () => {
      const parts = [
        createTextPart('1', 'Real message'),
        createTextPart('2', 'Synthetic message', true),
        createTextPart('3', 'Another real message'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect((filtered[0] as any).text).toBe('Real message');
      expect((filtered[1] as any).text).toBe('Another real message');
    });

    it('should filter out duplicate step-start parts', () => {
      const parts = [
        createStepStartPart('1'),
        createTextPart('2', 'Some text'),
        createStepStartPart('3'),
        createStepStartPart('4'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].type).toBe('step-start');
      expect(filtered[1].type).toBe('text');
    });

    it('should filter out internal system parts', () => {
      const parts = [
        createTextPart('1', 'User message'),
        { id: '2', sessionID: 'test', messageID: 'test', type: 'snapshot', snapshot: 'test' } as Part,
        { id: '3', sessionID: 'test', messageID: 'test', type: 'patch', hash: 'test', files: [] } as Part,
        createStepFinishPart('4'),
        createTextPart('5', 'Another message'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect((filtered[0] as any).text).toBe('User message');
      expect((filtered[1] as any).text).toBe('Another message');
    });

    it('should filter out todoread tool calls', () => {
      const parts = [
        createTextPart('1', 'Text message'),
        createToolPart('2', 'todoread', 'completed'),
        createToolPart('3', 'bash', 'completed'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].type).toBe('text');
      expect(filtered[1].type).toBe('tool');
      expect((filtered[1] as any).tool).toBe('bash');
    });

    it('should filter out pending and running tool calls', () => {
      const parts = [
        createToolPart('1', 'bash', 'pending'),
        createToolPart('2', 'bash', 'running'),
        createToolPart('3', 'bash', 'completed'),
        createToolPart('4', 'bash', 'error'),
      ];

      const filtered = filterMessageParts(parts);
      expect(filtered).toHaveLength(2);
      expect((filtered[0] as any).state.status).toBe('completed');
      expect((filtered[1] as any).state.status).toBe('error');
    });
  });

  describe('isPartVisible', () => {
    it('should return true for valid text parts', () => {
      expect(isPartVisible(createTextPart('1', 'Hello world'))).toBe(true);
    });

    it('should return false for synthetic text parts', () => {
      expect(isPartVisible(createTextPart('1', 'Hello world', true))).toBe(false);
    });

    it('should return false for empty text parts', () => {
      expect(isPartVisible(createTextPart('1', ''))).toBe(false);
      expect(isPartVisible(createTextPart('1', '   '))).toBe(false);
    });

    it('should return true for reasoning parts', () => {
      const reasoningPart: Part = {
        id: '1',
        sessionID: 'test',
        messageID: 'test',
        type: 'reasoning',
        text: 'Thinking...',
        time: { start: Date.now() },
      };
      expect(isPartVisible(reasoningPart)).toBe(true);
    });

    it('should return true for file parts', () => {
      const filePart: Part = {
        id: '1',
        sessionID: 'test',
        messageID: 'test',
        type: 'file',
        mime: 'text/plain',
        url: '/test/file.txt',
      };
      expect(isPartVisible(filePart)).toBe(true);
    });

    it('should return false for todoread tool calls', () => {
      expect(isPartVisible(createToolPart('1', 'todoread', 'completed'))).toBe(false);
    });

    it('should return true for completed/error tool calls', () => {
      expect(isPartVisible(createToolPart('1', 'bash', 'completed'))).toBe(true);
      expect(isPartVisible(createToolPart('1', 'bash', 'error'))).toBe(true);
    });

    it('should return false for pending/running tool calls', () => {
      expect(isPartVisible(createToolPart('1', 'bash', 'pending'))).toBe(false);
      expect(isPartVisible(createToolPart('1', 'bash', 'running'))).toBe(false);
    });

    it('should return false for system parts', () => {
      const snapshotPart: Part = { id: '1', sessionID: 'test', messageID: 'test', type: 'snapshot', snapshot: 'test' };
      const patchPart: Part = { id: '2', sessionID: 'test', messageID: 'test', type: 'patch', hash: 'test', files: [] };
      const stepFinishPart = createStepFinishPart('3');

      expect(isPartVisible(snapshotPart)).toBe(false);
      expect(isPartVisible(patchPart)).toBe(false);
      expect(isPartVisible(stepFinishPart)).toBe(false);
    });
  });

  describe('categorizeMessageParts', () => {
    it('should categorize parts correctly', () => {
      const parts = [
        createTextPart('1', 'Visible text'),
        createTextPart('2', '', false), // Empty text - should be hidden
        createToolPart('3', 'bash', 'completed'), // Should be visible
        createToolPart('4', 'bash', 'pending'), // Should be hidden
        createStepFinishPart('5'), // Should be hidden
      ];

      const result = categorizeMessageParts(parts);

      expect(result.total).toBe(5);
      expect(result.visible).toHaveLength(2);
      expect(result.hidden).toHaveLength(3);
      expect(result.hasContent).toBe(true);

      expect((result.visible[0] as any).text).toBe('Visible text');
      expect((result.visible[1] as any).tool).toBe('bash');
    });

    it('should return hasContent false when no visible parts', () => {
      const parts = [
        createTextPart('1', '', false),
        createToolPart('2', 'bash', 'pending'),
        createStepFinishPart('3'),
      ];

      const result = categorizeMessageParts(parts);

      expect(result.hasContent).toBe(false);
      expect(result.visible).toHaveLength(0);
      expect(result.hidden).toHaveLength(3);
    });
  });
});